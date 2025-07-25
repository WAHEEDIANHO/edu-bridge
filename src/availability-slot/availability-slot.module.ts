import { Module } from '@nestjs/common';
import { AvailabilitySlotService } from './availability-slot.service';
import { AvailabilitySlotController } from './availability-slot.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AvailabilitySlot } from './entities/availability-slot.entity';
import { UtilsModule } from '../utils/utils.module';
import { JwtModule } from '@nestjs/jwt';
import { MentorModule } from '../mentor/mentor.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([AvailabilitySlot]),
    UtilsModule,
    JwtModule
  ],
  controllers: [AvailabilitySlotController],
  providers: [AvailabilitySlotService],
  exports: [AvailabilitySlotService]
})
export class AvailabilitySlotModule {}
