import { IGeneralService } from '../../../utils/abstract/service/i-general.service';
import { Mentee } from '../../entities/mentee.entity';
import { Mentor } from '../../../mentor/entities/mentor.entity';
import { Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';

export interface IMenteeService extends IGeneralService<Mentee> {
  findByUserId(userid: string): Promise<Mentee|null>;

}