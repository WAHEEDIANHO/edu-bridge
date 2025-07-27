import { IsUUID, IsOptional, IsString, IsNumber, IsBoolean, IsDate, IsDateString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {

  @ApiProperty()
  @IsUUID()
  slotId: string;

  @ApiProperty()
  @IsUUID()
  mentorId: string;

  @ApiProperty({required: false})
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty()
  @IsDateString()
  preferDate: Date;

  @ApiProperty()
  @IsString()
  preferTime: string; // HH format

  @ApiProperty()
  @IsNumber()
  duration: number

  @ApiProperty()
  @IsString()
  subject: string; // default to false if not provided
}