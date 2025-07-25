import { IEntity } from '../../../utils/abstract/database/i-enity';
import { AvailabilitySlot } from '../../entities/availability-slot.entity';
import { IGeneralService } from '../../../utils/abstract/service/i-general.service';

export interface IAvailabilitySlotService extends IGeneralService<AvailabilitySlot> {

}