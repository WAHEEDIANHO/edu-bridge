import { Injectable } from '@nestjs/common';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { GeneralService } from '../utils/abstract/service/general.service';
import { Session } from './entities/session.entity';
import { ISessionService } from './abstract/service/i-session-service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class SessionService extends GeneralService<Session> implements ISessionService
{
  constructor(@InjectRepository(Session) private readonly repo: Repository<Session>,) {
    super(repo);
  }
}
