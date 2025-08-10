import { Module, forwardRef } from '@nestjs/common';
import { BookingService } from './booking.service';
import { BookingController } from './booking.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Booking } from './entities/booking.entity';
import { JwtModule } from '@nestjs/jwt';
import { UtilsModule } from '../utils/utils.module';
import { Mentor } from '../mentor/entities/mentor.entity';
import { MentorModule } from '../mentor/mentor.module';
import { MentorService } from '../mentor/mentor.service';
import { UserModule } from '../user/user.module';
import { UserService } from '../user/user.service';
import { AuthModule } from '../auth/auth.module';
import { MenteeModule } from '../mentee/mentee.module';
import { AvailabilitySlotModule } from '../availability-slot/availability-slot.module';
import { AvailabilitySlotService } from '../availability-slot/availability-slot.service';
import { Mentee } from '../mentee/entities/mentee.entity';
import { AvailabilitySlot } from '../availability-slot/entities/availability-slot.entity';
import { MenteeService } from '../mentee/mentee.service';
import { User } from '../user/entities/user.entity';
import { EmailServiceService } from '../email-service/email-service.service';
import { ConferenceModule } from '../conference/conference.module';
import { ConferenceService } from '../conference/conference.service';
import { HttpModule } from '@nestjs/axios';
import { SessionModule } from '../session/session.module';
import { WalletModule } from '../transaction/wallet/wallet.module';
// import { BookingEventHandler } from './events/booking-event.handler';

@Module({
  imports: [
    TypeOrmModule.forFeature([Booking, Mentor, Mentee, AvailabilitySlot, User]), 
    JwtModule, 
    UtilsModule,
    UserModule,  
    AvailabilitySlotModule, 
    ConferenceModule, 
    forwardRef(() => SessionModule), 
    forwardRef(() => WalletModule)
  ],
  controllers: [BookingController],
  providers: [BookingService, MentorService, MenteeService,
    AvailabilitySlotService, UserService, EmailServiceService],
  exports: [BookingService, ConferenceModule]
})
export class BookingModule {}
//whati remove MenteeModule, mentorModule