import { CreateUserDto } from '../../auth/dto/create-user.dto';
import { Column } from 'typeorm';
import { AvailabilityStatus } from '../abstraction/enum/availability-status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsCurrency, IsEnum, IsString } from 'class-validator';

export class CreateMentorDto extends CreateUserDto {
  @ApiProperty({ required: true })
  @IsString({ message: 'subject must be a string' })
  subject: string;
  @ApiProperty({ required: true })
  @IsString({ message: 'value must be a string' })
  introVideoUrl: string;
  @ApiProperty({required: true})
  @IsString({message: 'value must be a string' })
  bio: string;
  @ApiProperty({ required: true })
  @IsCurrency({ allow_decimal: true, allow_negatives: false })
  ratePerHour: number;
  @ApiProperty({ required: true, enum: AvailabilityStatus })
  @IsEnum(AvailabilityStatus, { message: 'availability must be one of the following values: AVAILABLE, ADVANCE' })
  availability: AvailabilityStatus;
  @ApiProperty({ required: true })
  @IsString({ message: 'value must be a string' })
  profilePictureUrl: string;
  @ApiProperty({ required: false })
  @IsString({ message: 'value must be a string' })
  location: string;
  isVerified: boolean;
}
