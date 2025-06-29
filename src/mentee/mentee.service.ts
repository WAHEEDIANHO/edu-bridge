import { Injectable } from '@nestjs/common';
import { CreateMenteeDto } from './dto/create-mentee.dto';
import { UpdateMenteeDto } from './dto/update-mentee.dto';
import { UserService } from '../auth/user.service';
import { GeneralService } from '../utils/abstract/service/general.service';
import { Mentee } from './entities/mentee.entity';
import { IMenteeService } from './abstraction/service/i-mentee.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MenteeService extends GeneralService<Mentee> implements IMenteeService {

  constructor(
    @InjectRepository(Mentee) private readonly repo: Repository<Mentee>,
    private readonly userService: UserService
  ) {
    super(repo);
  }

}
