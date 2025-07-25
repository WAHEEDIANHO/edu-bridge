import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent } from 'typeorm';
import { Booking } from '../entities/booking.entity';
import { AvailabilitySlot } from '../../availability-slot/entities/availability-slot.entity';
import { BookingEvent } from '../abstraction/event/booking.event';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

@Injectable()
export class BookingSubscriber implements EntitySubscriberInterface<Booking>
{
  constructor(private readonly eventBus: EventBus) {}


  listenTo() {
    return Booking;
  }


  async afterInsert(event: InsertEvent<any>) {
    // console.log("subscriber was called");
    const booking = event.entity as Booking;
    if (booking) {
      const slotReEpo =await event.manager.getRepository(AvailabilitySlot)
        .findOne({
          where: { id: booking.slot.id },
          relations: ['bookings']
        })

      if(!slotReEpo) return;
      if(slotReEpo.bookings.length == slotReEpo.no_of_participant_allow){
        // slotReEpo.is_open_for_booking = false;
        // await event.manager.getRepository(AvailabilitySlot).save(slotReEpo);

        console.log(slotReEpo.id)
        this.eventBus.publish(new BookingEvent(slotReEpo, booking));

        // console.log("event published")
      }
    }

  }

}


// import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent } from 'typeorm';
// import { Booking } from '../entities/booking.entity';
// import { AvailabilitySlot } from '../../availability-slot/entities/availability-slot.entity';
// import { BookingEvent } from '../abstraction/event/booking.event';
// import { Injectable } from '@nestjs/common';
// import { EventBus } from '@nestjs/cqrs';
//
//
// @Injectable()
// @EventSubscriber()
// export class BookingSubscriber implements EntitySubscriberInterface<Booking>
// {
//   constructor(private readonly evenBus: EventBus) {}
//
//
//   listenTo() {
//     return Booking;
//   }
//
//
//   async afterInsert(event: InsertEvent<any>) {
//     console.log("subscriber was called");
//     const booking = event.entity as Booking;
//     if (booking) {
//       const slotReEpo =await event.manager.getRepository(AvailabilitySlot)
//         .findOne({
//           where: { id: booking.slot.id },
//           relations: ['bookings']
//         })
//
//       if(!slotReEpo) return;
//       if(slotReEpo.bookings.length == slotReEpo.no_of_participant_allow){
//         slotReEpo.is_open_for_booking = false;
//         await event.manager.getRepository(AvailabilitySlot).save(slotReEpo);
//
//         this.evenBus.  (new BookingEvent(slotReEpo, booking));
//         console.log("event published")
//       }
//     }
//
//
//   }
//
//
// }