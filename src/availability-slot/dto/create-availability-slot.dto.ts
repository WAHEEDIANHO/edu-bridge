import { IsUUID, IsDateString, IsString, IsEnum, IsNumber } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { DayOfWeek } from '../abstraction/enums/day-of-week.enum';
import { MenteeLevel } from '../../mentee/abstraction/enums/mentee-level.enum';

export class CreateAvailabilitySlotDto {
  // @ApiProperty()
  // @IsUUID()
  // mentorId: string;

  @ApiProperty({ enum: DayOfWeek })
  @IsEnum(DayOfWeek)
  day: string; //

  @ApiProperty({ enum: MenteeLevel })
  @IsEnum(MenteeLevel)
  studentLevel: string;

  @ApiProperty()
  @IsString()
  startTime: string; //HH

  @ApiProperty()
  @IsString()
  endTime: string; // MM

  @ApiProperty({ type: 'integer' })
  @IsNumber()
  participantAllow: number;

}
