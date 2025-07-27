import { IsUUID, IsDateString, IsString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '../abstraction/enums/day-of-week.enum';
import { MenteeLevel } from '../../mentee/abstraction/enums/mentee-level.enum';

export interface ICreateAvailabilitySlotDto {
  day: DayOfWeek; // Day of the week
  startTime: string; // Start time in HH format
  endTime: string; // End time in MM format
}

export class CreateAvailabilitySlotDto {
  // @ApiProperty()
  // @IsUUID()
  // mentorId: string;

  @ApiProperty({ enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  day: string; //


  @ApiProperty()
  @IsString()
  startTime: string; //HH

  @ApiProperty()
  @IsString()
  endTime: string; // MM

}
