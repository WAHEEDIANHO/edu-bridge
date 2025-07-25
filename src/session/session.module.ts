import { Module } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { BookingEventHandler } from './events/booking-event.handler';
import { ConferenceModule } from '../conference/conference.module';
import { CqrsModule } from '@nestjs/cqrs';
import { AvailabilitySlotModule } from '../availability-slot/availability-slot.module';

@Module({
  imports: [TypeOrmModule.forFeature([Session]), ConferenceModule, CqrsModule, AvailabilitySlotModule],
  controllers: [SessionController],
  providers: [SessionService, BookingEventHandler],
  exports: [SessionService],
})
export class SessionModule {}
