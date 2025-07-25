import { PaginationQueryDto } from '../../utils/dto/pagination-query.dto';
import { Mentor } from '../../mentor/entities/mentor.entity';
import { Booking } from '../entities/booking.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';


export class BookingQueryDto extends PaginationQueryDto<Booking> {
  @ApiProperty({ required: false })
  @IsEnum(['pending', 'confirmed', 'cancelled', 'completed'])
  status?: string;

  @ApiProperty({ required: false })
  mentor?: string;

  @ApiProperty({ required: false })
  mentee?: string;
}