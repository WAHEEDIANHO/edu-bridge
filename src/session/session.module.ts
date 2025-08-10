import { Module, forwardRef } from '@nestjs/common';
import { SessionService } from './session.service';
import { SessionController } from './session.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Session } from './entities/session.entity';
import { BookingEventHandler } from './events/booking-event.handler';
import { ConferenceModule } from '../conference/conference.module';
import { CqrsModule } from '@nestjs/cqrs';
import { AvailabilitySlotModule } from '../availability-slot/availability-slot.module';
import { JwtModule } from '@nestjs/jwt';
import { UtilsModule } from '../utils/utils.module';
import { WalletModule } from '../transaction/wallet/wallet.module';
import { TransactionModule } from '../transaction/transaction.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Session]), 
    ConferenceModule, 
    CqrsModule, 
    AvailabilitySlotModule, 
    JwtModule, 
    UtilsModule,
    forwardRef(() => WalletModule),
    TransactionModule
  ],
  controllers: [SessionController],
  providers: [SessionService, BookingEventHandler],
  exports: [SessionService],
})
export class SessionModule {}
