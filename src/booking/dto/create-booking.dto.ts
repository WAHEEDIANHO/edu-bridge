import { IsUUID, IsOptional, IsString, IsNumber, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateBookingDto {

  @ApiProperty()
  @IsUUID()
  slotId: string;

  @ApiProperty({required: false})
  @IsOptional()
  @IsString()
  note?: string;

  @ApiProperty()
  @IsNumber()
  hoursBooked: number

  @ApiProperty({ required: false })
  @IsBoolean()
  recurrent?: boolean = false; // default to false if not provided
}