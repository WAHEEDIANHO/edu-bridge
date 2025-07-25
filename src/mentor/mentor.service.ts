import { Injectable } from '@nestjs/common';
import { CreateMentorDto } from './dto/create-mentor.dto';
import { UpdateMentorDto } from './dto/update-mentor.dto';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from '../user/user.service';
import { GeneralService } from '../utils/abstract/service/general.service';
import { Mentor } from './entities/mentor.entity';
import { IMentorService } from './abstraction/service/i-mentor.service';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { AvailabilitySlot } from '../availability-slot/entities/availability-slot.entity';
import { AvailabilitySlotService } from '../availability-slot/availability-slot.service';
import { PaginationQueryDto } from '../utils/dto/pagination-query.dto';
import { PaginatedResultDto } from '../utils/dto/paginated-result.dto';
import { BookingService } from '../booking/booking.service';
import { Booking } from '../booking/entities/booking.entity';
import { DayOfWeek } from '../availability-slot/abstraction/enums/day-of-week.enum';
import { MentorQueryDto } from './dto/mentor-query-dto';

@Injectable()
export class MentorService
  extends GeneralService<Mentor>
  implements IMentorService
{
  constructor(
    @InjectRepository(Mentor) private readonly repo: Repository<Mentor>,
    private readonly availabilitySlotService: AvailabilitySlotService,
    private readonly bookingService: BookingService,
  ) {
    super(repo);
  }

  async verifyMentor(mentor: Mentor): Promise<void> {
    mentor.isVerified = true;
    await this.repo.save(mentor);
  }

  async findByUserId(userid: string): Promise<Mentor | null> {
    return await this.repo.findOne({
      where: { user: { id: userid } },
      relations: ['user'],
    });
  }

  async geyMyStudent(teacherId: string): Promise<any> {

    const slots = await this.availabilitySlotService.findAll({ mentor: { id: teacherId } } as PaginationQueryDto<AvailabilitySlot>, ['bookings']);

    const { data }: any = slots || {};
    const bookings = data?.map((slot) => slot.bookings).flat() || [];

    let students: any[] = [];
    for (const slot of bookings) {
      const obx: any = await this.bookingService.findById(slot.id, ['mentee', 'mentee.user', 'mentee.preferredSubjects']);
      students.push(obx.mentee);
    }

    return  Array.from(new Map(students.map((item) => [item.id, item])).values());

  }

  async getUpcomingSession(query: PaginationQueryDto<Booking>, id: string): Promise<any> {

    const allDays = Object.values(DayOfWeek);
    const todayIndex = new Date().getDay();
    const remainingDays= allDays.slice(todayIndex);
    // Object.values(DayOfWeek)[new Date().getDay()]

    const slots =
      await this.availabilitySlotService
        .findAll({ ...query, day: `in:${JSON.stringify(remainingDays)}`, mentor: { id: id }, is_open_for_booking: false  } as PaginationQueryDto<AvailabilitySlot>, ['mentor',  'bookings']);
    const { data }: any = slots || {};

    const bookings = data?.map((slot) => slot.bookings).flat() || [];

    let bookingWithScheduleStudent: any[] = [];
    for (const slot of bookings) {
      const obx: any = await this.bookingService.findById(slot.id, ['mentee', 'mentee.user', 'mentee.preferredSubjects', 'slot.session']);
      bookingWithScheduleStudent.push(obx);
    }

    return bookingWithScheduleStudent;
    // return  Array.from(new Map(bookingWithScheduleStudent.map((item) => [item.id, item])).values());

  }

  async getAvailableMentors(query: MentorQueryDto)
  {
    const slots =
      await this.availabilitySlotService
        .findAll({ ...query, is_open_for_booking: true  } as PaginationQueryDto<AvailabilitySlot>, ['mentor']);
    const { data }: any = slots || {};

    let mentors: any[] = [];
    for (const slot of data) {
      const obx: any = await this.repo.findOne({ where: { id: slot.mentor.id }, relations: ['user', 'competencySubjects'] }); //(slot.id, ['mentee', 'mentee.user', 'mentee.preferredSubjects', 'session']);
      // const mentor = obx.mentor;
      delete slot.mentor;
      const user = this.flattenObject(obx);
        mentors.push({
          slot,
          user
        });
    }
    mentors = this.groupByUser(mentors);
    return mentors;
  }


    private flattenObject(obj, parent = '', res = {}) {
      for (let key in obj) {
        if (!obj.hasOwnProperty(key)) continue;

        const propName = key; //parent ? `${parent}_${key}` : key;

        if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
          this.flattenObject(obj[key], propName, res);
        } else {
          res[propName] = obj[key];
        }
      }
      return res;
  }


  private groupByUser(data) {
  const map = new Map();

  for (const item of data) {
      const userId = item.user.id;

      if (!map.has(userId)) {
        // Clone user and create slots array
        map.set(userId, {
          ...item.user,
          slots: [item.slot]
        });
      } else {
        // Add slot to existing user group
        map.get(userId).slots.push(item.slot);
      }
    }

    return Array.from(map.values());
  }

}
