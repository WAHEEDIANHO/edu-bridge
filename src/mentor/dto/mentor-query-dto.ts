import { PaginationQueryDto } from '../../utils/dto/pagination-query.dto';
import { Mentor } from '../entities/mentor.entity';
import { AvailabilityStatus } from '../abstraction/enum/availability-status.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';


export class MentorQueryDto extends PaginationQueryDto<Mentor> {

  @ApiProperty({required: false})
  @IsString({message: 'Subject must be a string'})
  subject: string;

  @ApiProperty({ required: false})
  ratePerHour: number;

  @ApiProperty({ required: false, enum: AvailabilityStatus })
  @IsEnum(AvailabilityStatus, { message: 'Availability must be one of the defined statuses (AVAILABLE, ADVANCE)' })
  availability: AvailabilityStatus;

}