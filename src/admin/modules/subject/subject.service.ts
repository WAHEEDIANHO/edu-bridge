import { Injectable } from '@nestjs/common';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { GeneralService } from '../../../utils/abstract/service/general.service';
import { Subject } from './entities/subject.entity';
import { IGeneralService } from '../../../utils/abstract/service/i-general.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SubjectService extends GeneralService<Subject> implements IGeneralService<Subject>
{
  constructor(
    @InjectRepository(Subject) repo: Repository<Subject>
  ) {
    super(repo);
  }

}
