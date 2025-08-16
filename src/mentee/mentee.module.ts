import { Module } from '@nestjs/common';
import { MenteeService } from './mentee.service';
import { MenteeController } from './mentee.controller';
import { AuthModule } from '../auth/auth.module';
import { UserService } from '../user/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { HashPassword } from '../utils/hash-password';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Mentee } from './entities/mentee.entity';
import { EmailServiceService } from '../email-service/email-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExtractToken } from '../utils/extract-token';
import { MenteeSubject } from './entities/mentee_subject.entity';
import { BookingModule } from '../booking/booking.module';
import { AvailabilitySlotModule } from '../availability-slot/availability-slot.module';
import { Booking } from '../booking/entities/booking.entity';
import { AvailabilitySlot } from '../availability-slot/entities/availability-slot.entity';
import { Subject } from '../admin/modules/subject/entities/subject.entity';
import { Session } from '../session/entities/session.entity';
import { SessionModule } from '../session/session.module';
import { RatingModule } from '../rating/rating.module';
import { WalletModule } from '../transaction/wallet/wallet.module';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [TypeOrmModule.forFeature([User, Mentee, MenteeSubject, Booking, AvailabilitySlot, MenteeSubject, MenteeSubject, Subject, Session]), AuthModule,
    BullModule.registerQueue({
      name: "payment"
    }),
    JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      secret: configService.get('SECRET_KEY'),
    }),
  }),ConfigModule, BookingModule, AvailabilitySlotModule, SessionModule, RatingModule, WalletModule],
  controllers: [MenteeController],
  providers: [MenteeService, UserService, HashPassword, EmailServiceService, ExtractToken],
})
export class MenteeModule {}
