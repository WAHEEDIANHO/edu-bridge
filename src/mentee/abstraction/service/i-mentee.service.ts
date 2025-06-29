import { IGeneralService } from '../../../utils/abstract/service/i-general.service';
import { Mentee } from '../../entities/mentee.entity';

export interface IMenteeService extends IGeneralService<Mentee> {}