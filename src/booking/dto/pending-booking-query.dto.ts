import { PaginationQueryDto } from '../../utils/dto/pagination-query.dto';
import { Booking } from '../entities/booking.entity';

export class PendingBookingQueryDto extends PaginationQueryDto<Booking> {
}