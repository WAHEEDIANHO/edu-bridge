import {
  Controller,
  Post,
  Get,
  Param,
  Body,
  Patch,
  Delete,
  UseGuards,
  Res,
  Req,
  HttpStatus,
  Query, Inject,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import { CreateBookingDto } from './dto/create-booking.dto';
import { UpdateBookingDto } from './dto/update-booking.dto';
import { UserRole } from '../user/entities/user.entity';
import { ApiBearerAuth, ApiExcludeController } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Roles } from '../auth/decorator/role.decorator';
import { Request, Response } from 'express';
import { Booking } from './entities/booking.entity';

import { BookingQueryDto } from './dto/BookingQueryDto';
import { PendingBookingQueryDto } from './dto/pending-booking-query.dto';
import { PaginationQueryDto } from '../utils/dto/pagination-query.dto';
import { MentorService } from '../mentor/mentor.service';
import { RoleGuard } from '../auth/guard/role.guard';
import { MenteeService } from '../mentee/mentee.service';
import { AvailabilitySlotService } from '../availability-slot/availability-slot.service';
import { ValidationPipe } from '../utils/validation.pipe';
import { EventBus } from '@nestjs/cqrs';
import { AvailabilitySlot } from '../availability-slot/entities/availability-slot.entity';
import { BookingEvent } from './abstraction/event/booking.event';
import { Session } from '../session/entities/session.entity';
import { ConferenceService } from '../conference/conference.service';
import { SessionService } from '../session/session.service';



@Controller('bookings')
export class BookingController {
  constructor(
    private readonly service: BookingService,
    private readonly mentorService: MentorService,
    private readonly menteeService: MenteeService,
    private readonly availabilitySlotService: AvailabilitySlotService,
    private readonly conferenceService: ConferenceService,
    private readonly sessionService: SessionService,
    // Assuming this is the service that handles conference/zoom meetings
    // private readonly eventBus: EventBus
    ) {}


  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles(UserRole.Student)
  @Post()
  async create(@Req() req: Request, @Body(new ValidationPipe()) dto: CreateBookingDto, @Res() res:  Response): Promise<Response> {

    const { sub } = req.user as any;

    const student = await this.menteeService.findByUserId(sub);
    if (!student) {
      return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.NOT_FOUND, "you are not a student"));
    }


    const booking = new Booking();
    booking.mentee = student;
    booking.slot = dto.slotId as any //selectedSlot;
    booking.note = dto?.note || "";
    booking.duration = dto.duration;
    booking.prefer_time = dto.preferTime;
    booking.prefer_date = dto.preferDate;
    booking.subject = dto.subject as any;
    booking.mentor = dto.mentorId as any;
    await this.service.create(booking);

    return res.status(HttpStatus.CREATED).json(res.formatResponse(HttpStatus.CREATED, "successful", { id: booking.id }))
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get()
  async findAll(@Query() bookingQuery: BookingQueryDto, @Res() res: Response): Promise<Response> {
    const paginated = await this.service.findAll(bookingQuery, ['mentor', 'mentee', 'slot', 'subject']);

    const preArray: any = [];
    for(const booking of paginated.data) {
      const fullBookingDetails = await this.service.findById(booking.id, ['mentor.user', 'mentee.user', 'subject']);
      this.flattenObject(fullBookingDetails?.mentee);
      preArray.push(fullBookingDetails);
    }

    paginated.data = preArray;

    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "booking retrieved successfully", paginated));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles(...[UserRole.Teacher, UserRole.ADMIN])
  @Get('pending-request')
  async getPendingScheduling(@Req() req: Request ,@Query() query: PendingBookingQueryDto, @Res() res: Response): Promise<Response> {
    const { sub } = req.user as any;
    const mentor = await this.mentorService.findByUserId(sub);
    if (!mentor) {
      return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.NOT_FOUND, "you are not a mentor"));
    }
    const bookings = await this.service.findAll({...query, status: 'pending', mentor:  { id: mentor.id }  } as PaginationQueryDto<Booking>, ['mentor', 'mentee', 'slot']);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "booking retrieved successfully", bookings));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    const mentor = await this.service.findById(id, ['user']);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentor found successfully", mentor));
  }


  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.Teacher)
  @Patch(':id')
  async update(@Param('id') id: string, @Body(new ValidationPipe()) dto: UpdateBookingDto, @Res() res: Response): Promise<Response> {
    const booking = await this.service.findById(id, ['mentee', 'mentor', 'subject']);
    if (!booking) return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "no booking with the given Id"));
    booking.status = dto.status;

    if(dto.status === 'confirmed') {
      const [hours, minutes] = booking.prefer_time.split(':').map(Number);
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes)
      const endDate = new Date(startDate.getTime() + booking.duration * 60 * 60 * 1000);

      // Format result as HH:mm
      const endHours = endDate.getHours().toString().padStart(2, '0');
      const endMinutes = endDate.getMinutes().toString().padStart(2, '0');
      const endTime = `${endHours}:${endMinutes}`;


      let zoomLink = await this.conferenceService.createMeeting("Edu-Bridge Virtual classroom");
      const session = new Session();
      session.notes = booking.note;
      session.zoom_start_link = zoomLink.start_url;
      session.zoom_join_link = zoomLink.join_url;
      session.session_date = booking.prefer_date;
      session.startTime = booking.prefer_time;
      session.endTime = endTime;
      session.booking = booking;
      session.mentee = booking.mentee;
      session.mentor = booking.mentor;
      session.mentee_name = this.mergeName(session.mentee.user.firstName, session.mentee.user.lastName);
      session.mentor_name = this.mergeName(session.mentor.user.firstName, session.mentor.user.lastName);
      session.session_subject = booking.subject.id;

      await this.sessionService.create(session);
    }
    await this.service.update(booking);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "OK", booking));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    await this.service.delete(id);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "successful"));
  }


  private flattenObject(obj, parent = '', res = {}) {
    for (let key in obj) {
      if (!obj.hasOwnProperty(key)) continue;

      const propName = key; //parent ? `${parent}_${key}` : key;

      if (
        typeof obj[key] === 'object' &&
        obj[key] !== null &&
        !Array.isArray(obj[key])
      ) {
        this.flattenObject(obj[key], propName, res);
      } else {
        res[propName] = obj[key];
      }
    }
    return res;
  }


  private mergeName(firstname: string, lastname: string) {
    return `${firstname} ${lastname}`;
  }

}
