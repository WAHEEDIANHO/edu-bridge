import { Inject, Injectable } from '@nestjs/common';
import { GeneralService } from '../utils/abstract/service/general.service';
import { Booking } from './entities/booking.entity';
import { IBookingService } from './abstraction/service/i-booking.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mentor } from '../mentor/entities/mentor.entity';
import { ensureEntityExists } from '../utils/entity-exist';
import { AvailabilitySlot } from '../availability-slot/entities/availability-slot.entity';
import * as console from 'node:console';
import { ConferenceService } from '../conference/conference.service';
import { SessionService } from '../session/session.service';
import { Session } from '../session/entities/session.entity';


@Injectable()
export class BookingService extends GeneralService<Booking> implements IBookingService {

  public constructor(
    @InjectRepository(Booking) private readonly bookingRepository: Repository<Booking>,
    @Inject(ConferenceService) private readonly conferenceService: ConferenceService,
    @Inject(SessionService) private readonly sessionService: SessionService
  ) {
    super(bookingRepository);
  }


  async create(data: Booking): Promise<boolean> {
    const { mentor, slot, mentee, prefer_date, prefer_time, duration } = data;
    
    // Validate that the slot exists and belongs to the mentor
    const existingSlot = await this.bookingRepository.manager.getRepository(AvailabilitySlot)
      .findOne({
        where: {
          id: slot?.id ?? slot,
          mentor: { id: mentor?.id ?? mentor },
        },
        relations: ['mentor'],
      });

    if (existingSlot == null) {
      throw new Error('Invalid or unavailable slot');
    }

    // Validate that the preferred date falls on the day of week specified in the slot
    const preferredDate = new Date(prefer_date);
    const dayOfWeek = this.getDayOfWeek(preferredDate);
    
    if (dayOfWeek !== existingSlot.day) {
      throw new Error(`Selected date must be on ${existingSlot.day}, but it's on ${dayOfWeek}`);
    }

    // Validate that the preferred time and duration fall within the slot's time range
    const slotStartTime = this.parseTime(existingSlot.startTime);
    const slotEndTime = this.parseTime(existingSlot.endTime);
    const preferredStartTime = this.parseTime(prefer_time);
    const preferredEndTime = this.calculateEndTime(preferredStartTime, duration);

    if (preferredStartTime < slotStartTime || preferredEndTime > slotEndTime) {
      throw new Error(`Selected time and duration must be within the slot's time range (${existingSlot.startTime} - ${existingSlot.endTime})`);
    }

    // Check for overlapping bookings with the same mentor on the same date and time
    const overlappingBookings = await this.bookingRepository.find({
      where: {
        mentor: { id: mentor?.id ?? mentor },
        prefer_date: prefer_date,
        status: "confirmed"
      },
      relations: ['mentor'],
    });

    for (const booking of overlappingBookings) {
      const bookingStartTime = this.parseTime(booking.prefer_time);
      const bookingEndTime = this.calculateEndTime(bookingStartTime, booking.duration);

      // Check if the new booking overlaps with an existing booking
      if (
        (preferredStartTime >= bookingStartTime && preferredStartTime < bookingEndTime) ||
        (preferredEndTime > bookingStartTime && preferredEndTime <= bookingEndTime) ||
        (preferredStartTime <= bookingStartTime && preferredEndTime >= bookingEndTime)
      ) {
        throw new Error(`Time slot already booked from ${booking.prefer_time} to ${this.formatTime(bookingEndTime)}`);
      }
    }

    return super.create(data);
  }

  // Helper function to get the day of week from a date
  private getDayOfWeek(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
  }

  // Helper function to parse time string (HH:MM:SS) to minutes since midnight
  private parseTime(timeString: string): number {
    const [hours, minutes, seconds = '0'] = timeString.split(':').map(Number);
    return hours * 60 + minutes;
  }

  // Helper function to calculate end time based on start time and duration
  private calculateEndTime(startTimeMinutes: number, durationHours: number): number {
    return startTimeMinutes + durationHours * 60;
  }

  // Helper function to format minutes since midnight to time string (HH:MM)
  private formatTime(timeMinutes: number): string {
    const hours = Math.floor(timeMinutes / 60);
    const minutes = timeMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }


  // async update(data: Booking): Promise<boolean> {
  //
  //   if(data.status === 'confirmed') {
  //     // let zoomLink = await this.conferenceService.createMeeting("Edu-Bridge Virtual classroom");
  //     // const session = new Session();
  //     // session.notes = data.note;
  //     // session.zoom_start_link = zoomLink.start_url;
  //     // session.zoom_join_link = zoomLink.join_url;
  //
  //     // data.session = session;
  //     // await this.bookingRepository.save(data);
  //
  //     //send meeting link to mentor and mentee
  //
  //
  //   }
  //
  //   return super.update(data);
  // }
}
