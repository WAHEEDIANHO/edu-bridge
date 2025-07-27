import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { BookingEvent } from '../../booking/abstraction/event/booking.event';
import { SessionService } from '../session.service';
import { Inject, Injectable } from '@nestjs/common';
import { ConferenceService } from '../../conference/conference.service';
import { Session } from '../entities/session.entity';
import { AvailabilitySlotService } from '../../availability-slot/availability-slot.service';

@Injectable()
@EventsHandler(BookingEvent)
export class BookingEventHandler implements IEventHandler<BookingEvent> {
  constructor(
    @Inject(SessionService) private readonly sessionService: SessionService,
    @Inject(ConferenceService) private readonly conferenceService: ConferenceService,
    @Inject(AvailabilitySlotService) private readonly availabilitySlotService: AvailabilitySlotService
  ) {}

  async handle(event: BookingEvent) {

    // console.log("event handler was called", event.booking.id, event.slot.id);
    const booking = event.booking;
    const slot = event.slot;
    let zoomLink = await this.conferenceService.createMeeting("Edu-Bridge Virtual classroom");
    const session = new Session();
    session.notes = booking.note;
    session.zoom_start_link = zoomLink.start_url;
    session.zoom_join_link = zoomLink.join_url;
    session.startTime = slot.startTime;
    session.endTime = slot.endTime;
    // session.level = slot.level;
    // session.no_of_participant_allow = slot.no_of_participant_allow;
    // session.slot = slot;

    //saving can later implement typeorm transaction
    await this.sessionService.create(session);
    // slot.session = session;
    // slot.is_open_for_booking = false;
    await this.availabilitySlotService.update(slot);
  }
}