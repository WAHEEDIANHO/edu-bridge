import { IGeneralService } from '../../../utils/abstract/service/i-general.service';
import { Booking } from '../../entities/booking.entity';

export interface IBookingService extends IGeneralService<Booking> {
}