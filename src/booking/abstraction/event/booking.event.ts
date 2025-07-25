import { Booking } from '../../entities/booking.entity';
import { AvailabilitySlot } from '../../../availability-slot/entities/availability-slot.entity';


export class BookingEvent {


  constructor(
    public readonly slot: AvailabilitySlot,
    public readonly booking: Booking
  ) { }
}