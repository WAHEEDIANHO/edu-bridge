import { Injectable } from '@nestjs/common';
import { CreateMentorDto } from './dto/create-mentor.dto';
import { UpdateMentorDto } from './dto/update-mentor.dto';
import { ApiTags } from '@nestjs/swagger';
import { UserService } from '../auth/user.service';
import { GeneralService } from '../utils/abstract/service/general.service';
import { Mentor } from './entities/mentor.entity';
import { IMentorService } from './abstraction/service/i-mentor.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class MentorService extends GeneralService<Mentor> implements IMentorService {

  constructor(
    @InjectRepository(Mentor) private readonly repo: Repository<Mentor>,
    private readonly userService: UserService,
  ) {
    super(repo);
  }

}
