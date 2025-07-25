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



@Controller('bookings')
export class BookingController {
  constructor(
    private readonly service: BookingService,
    private readonly mentorService: MentorService,
    private readonly menteeService: MenteeService,
    private readonly availabilitySlotService: AvailabilitySlotService,
    private readonly eventBus: EventBus
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

    const selectedSlot = await this.availabilitySlotService.findById(dto.slotId, ['mentor', 'bookings']);
    if (!selectedSlot) {
      return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.NOT_FOUND, "time slot not found!"));
    }

    if(student.level != selectedSlot.level) {
      return  res.status(HttpStatus.CONFLICT).json(res.formatResponse(HttpStatus.CONFLICT, "level conflict!"));
    }

    const confirmedBooking = selectedSlot.bookings.filter((booking) => booking.status === 'confirmed');


    if(!selectedSlot.is_open_for_booking || selectedSlot.no_of_participant_allow == confirmedBooking.length) {
      return  res.status(HttpStatus.CONFLICT).json(res.formatResponse(HttpStatus.CONFLICT, "slot is not available"));
    }

    if(dto.recurrent && selectedSlot.no_of_participant_allow > 1) {
      return res.status(HttpStatus.CONFLICT).json(res.formatResponse(HttpStatus.CONFLICT, "recurrent booking is not allowed for this slot"));
    }

    const booking = new Booking();
    booking.mentor = selectedSlot.mentor; // dto.mentorId as any;
    booking.mentee = student;
    booking.slot = selectedSlot;
    booking.note = dto?.note || "";
    booking.hours_booked = dto.hoursBooked;
    booking.recurrent = dto?.recurrent || false;
    await this.service.create(booking);

    return res.status(HttpStatus.CREATED).json(res.formatResponse(HttpStatus.CREATED, "successful", { id: booking.id }))
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get()
  async findAll(@Query() bookingQuery: BookingQueryDto, @Res() res: Response): Promise<Response> {
    const bookings = await this.service.findAll(bookingQuery, ['mentor', 'mentee', 'slot']);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "booking retrieved successfully", bookings));
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
    const booking = await this.service.findById(id);
    if (!booking) return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "no booking with the given Id"));
    booking.status = dto.status;
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


}
