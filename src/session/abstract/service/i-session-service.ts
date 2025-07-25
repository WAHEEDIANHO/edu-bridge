import { IGeneralService } from '../../../utils/abstract/service/i-general.service';
import { Session } from '../../entities/session.entity';

export interface ISessionService extends IGeneralService<Session>
{
  
}