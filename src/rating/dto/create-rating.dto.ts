import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsOptional, IsUUID } from 'class-validator';

export class CreateRatingDto {

  @ApiProperty()
  @IsUUID()
  mentorId: string;

  @ApiProperty()
  @IsUUID()
  sessionId: string

  @ApiProperty()
  @IsNumber()
  rate: number;

  @ApiProperty({ required: false })
  @IsOptional()
  comment?: string
}
