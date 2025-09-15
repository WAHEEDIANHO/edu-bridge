import {
  IsUUID,
  IsOptional,
  IsString,
  IsNumber,
  IsBoolean,
  IsDate,
  IsDateString,
  IsInt,
  Min,
  Max,
} from 'class-validator';
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

  @ApiProperty({
    description: 'Duration must be a whole number between 1 and 5',
    minimum: 1,
    maximum: 5,
    example: 3,
  })
  @IsInt({ message: 'Duration must be a whole number' })
  @Min(1, { message: 'Duration cannot be less than 1' })
  @Max(5, { message: 'Duration cannot be greater than 5' })
  duration: number;

  @ApiProperty()
  @IsString()
  subject: string; // default to false if not provided
}