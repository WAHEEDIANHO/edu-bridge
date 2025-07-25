import { IGeneralService } from '../../../utils/abstract/service/i-general.service';
import { Mentor } from '../../entities/mentor.entity';

export interface IMentorService extends IGeneralService<Mentor> {
  verifyMentor(mentor: Mentor): Promise<void>;
  findByUserId(userid: string): Promise<Mentor|null>;
  geyMyStudent(teacherId: string): Promise<any>

}