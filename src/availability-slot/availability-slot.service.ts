import { Injectable } from '@nestjs/common';
import { CreateAvailabilitySlotDto } from './dto/create-availability-slot.dto';
import { UpdateAvailabilitySlotDto } from './dto/update-availability-slot.dto';
import { GeneralService } from '../utils/abstract/service/general.service';
import { AvailabilitySlot } from './entities/availability-slot.entity';
import { IAvailabilitySlotService } from './abstraction/service/i-availability-slot.service';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class AvailabilitySlotService extends GeneralService<AvailabilitySlot> implements IAvailabilitySlotService {
  public constructor(
    @InjectRepository(AvailabilitySlot) private readonly repo: Repository<AvailabilitySlot>,
  ) {
    super(repo);
  }

  async findOne({ id }: { id: string }): Promise<AvailabilitySlot | null> {
    return await this.repo.findOne({
      where: { id,  },
      relations: ['mentor', 'bookings'],
    });
  }
}
