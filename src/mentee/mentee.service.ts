import { Inject, Injectable } from '@nestjs/common';
import { CreateMenteeDto } from './dto/create-mentee.dto';
import { UpdateMenteeDto } from './dto/update-mentee.dto';
import { UserService } from '../user/user.service';
import { GeneralService } from '../utils/abstract/service/general.service';
import { Mentee } from './entities/mentee.entity';
import { IMenteeService } from './abstraction/service/i-mentee.service';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Mentor } from '../mentor/entities/mentor.entity';
import { PaginationQueryDto } from '../utils/dto/pagination-query.dto';
import { Booking } from '../booking/entities/booking.entity';
import { DayOfWeek } from '../availability-slot/abstraction/enums/day-of-week.enum';
import { AvailabilitySlot } from '../availability-slot/entities/availability-slot.entity';
import { BookingService } from '../booking/booking.service';
import { AvailabilitySlotService } from '../availability-slot/availability-slot.service';

@Injectable()
export class MenteeService extends GeneralService<Mentee> implements IMenteeService {

  constructor(
    @InjectRepository(Mentee) private readonly repo: Repository<Mentee>,
    @Inject(UserService) private readonly userService: UserService,
    @Inject(BookingService) private readonly bookingService: BookingService,
    @Inject(AvailabilitySlotService) private readonly availabilitySlotService: AvailabilitySlotService // Assuming this is injected correctly, replace with actual service if needed
  ) {
    super(repo);
  }


  async findByUserId(userid: string): Promise<Mentee|null> {
    return await this.repo.findOne({ where: { user: { id: userid } }, relations: ['user', 'preferredSubjects'] });
  }

  async upComingSchedule(query: PaginationQueryDto<Booking>, id: string): Promise<any> {
    const allDays = Object.values(DayOfWeek);
    const todayIndex = new Date().getDay();
    const remainingDays = allDays.slice(todayIndex);

    const slots = await this.availabilitySlotService.findAll({ ...query, day: `in:${JSON.stringify(remainingDays)}`, is_open_for_booking: false  } as PaginationQueryDto<AvailabilitySlot>, ['mentor', 'bookings', "session"]);

    const { data }: any = slots || {};
    let bookings = data?.map((slot) => slot.bookings).flat() || [];

    let bookingWithScheduleStudent: any[] = [];
    for (const booking of bookings) {

      const obx: any = await this.bookingService.findById(booking.id, ['mentee.user', 'mentee.preferredSubjects', 'mentor.user',  'mentee.preferredSubjects', 'slot.session']);
      console.log("obx", obx.mentee, id);
      if(obx.mentee.id == id) bookingWithScheduleStudent.push(obx);
    }

    return bookingWithScheduleStudent;
  }

  async getMyTutor(query: PaginationQueryDto<any>, id: string) {
    const slots = this.availabilitySlotService.findAll(query, ['bookings']);
    const { data }: any = slots || {};
    const bookings = data?.map((slot) => slot.bookings.filter((booking: any) => booking.id == id)).flat() || [];

    let myMentor: any[] = [];
    for (const booking of bookings) {

      const obx: any = await this.bookingService.findById(booking.id, ['mentor', 'mentor.user',  'mentor.competencySubjects']);
      console.log("obx", obx.mentee, id);
      // if(obx.mentee.id == id)
      myMentor.push(obx);
    }
    return  myMentor;
  }
}


export class MenteeSubjectService extends GeneralService<Mentee> implements IMenteeService {

  constructor(
    @InjectRepository(Mentee) private readonly repo: Repository<Mentee>,
  ) {
    super(repo);
  }

  async findByUserId(userid: string): Promise<Mentee|null> {
    return await this.repo.findOne({ where: { user: { id: userid } }, relations: ['user'] });
  }



  // async getMentorAvailability(mentorId: string, dayOfWeek: DayOfWeek): Promise<AvailabilitySlot[]>
  // {}

}

