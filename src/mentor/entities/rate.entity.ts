import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { Entity, ManyToOne } from 'typeorm';
import { Mentee } from '../../mentee/entities/mentee.entity';
import { Mentor } from './mentor.entity';


@Entity("tbl_rates")
export class Rate extends DbEntity implements IEntity {



  @ManyToOne(() => Mentee)
  mentee: Mentee;

  @ManyToOne(() => Mentor, (mentor: Mentor) => mentor.rates)
  mentor: Mentor;
}