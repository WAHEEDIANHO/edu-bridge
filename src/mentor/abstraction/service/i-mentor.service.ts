import { IGeneralService } from '../../../utils/abstract/service/i-general.service';
import { Mentor } from '../../entities/mentor.entity';

export interface IMentorService extends IGeneralService<Mentor> {}