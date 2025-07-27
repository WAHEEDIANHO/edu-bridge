import { forwardRef, Module } from '@nestjs/common';
import { MentorService } from './mentor.service';
import { MentorController } from './mentor.controller';
import { AuthModule } from '../auth/auth.module';
import { UserService } from '../user/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { HashPassword } from '../utils/hash-password';
import { Mentor } from './entities/mentor.entity';
import { EmailServiceService } from '../email-service/email-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExtractToken } from '../utils/extract-token';
import { Booking } from '../booking/entities/booking.entity';
import { AvailabilitySlotModule } from '../availability-slot/availability-slot.module';
import { AvailabilitySlot } from '../availability-slot/entities/availability-slot.entity';
import { AvailabilitySlotService } from '../availability-slot/availability-slot.service';
import { BookingModule } from '../booking/booking.module';
import { ConferenceModule } from '../conference/conference.module';
import { CompetencySubject } from './entities/competency-subject.entity';
import { SessionModule } from '../session/session.module';
import { RatingModule } from '../rating/rating.module';

@Module({
  imports: [TypeOrmModule.forFeature([User, Mentor, CompetencySubject, AvailabilitySlot]), AuthModule, JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      secret: configService.get('SECRET_KEY'),
    }),
  }),ConfigModule, AvailabilitySlotModule, BookingModule, SessionModule, RatingModule],
  controllers: [MentorController],
  providers: [MentorService, UserService, HashPassword, EmailServiceService, ConfigService, ExtractToken],
  exports: [MentorService]
})
export class MentorModule {}
