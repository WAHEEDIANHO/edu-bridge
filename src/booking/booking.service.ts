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
    const { mentor, slot, mentee, note } = data;
    const existingSlot = await this.bookingRepository.manager.getRepository(AvailabilitySlot)
      .findOne({
        where: {
          id: slot?.id ?? slot,
          mentor: { id: mentor?.id ?? mentor },
        },
        relations: ['mentor'],
      })

    console.log(existingSlot, )
    if (existingSlot == null) {
      throw new Error('Invalid or unavailable slot');
    }

    const conflict = await this.bookingRepository.findOne({
      where: {
        slot: { id: slot?.id ?? slot },
        status: "confirmed"
      },
      relations: ['slot'],
    });

    if (conflict) {
      throw new Error('Slot already booked');
    }
    return super.create(data);
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
