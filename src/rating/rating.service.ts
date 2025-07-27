import { Injectable } from '@nestjs/common';
import { CreateRatingDto } from './dto/create-rating.dto';
import { UpdateRatingDto } from './dto/update-rating.dto';
import { GeneralService } from '../utils/abstract/service/general.service';
import { Rating } from './entities/rating.entity';
import { IGeneralService } from '../utils/abstract/service/i-general.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class RatingService extends GeneralService<Rating> implements IGeneralService<Rating>{

  constructor(@InjectRepository(Rating) private readonly ratingRepository: Repository<Rating>,) {
    super(ratingRepository);
  }

}
