import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { Session } from '../../session/entities/session.entity';
import { Mentee } from '../../mentee/entities/mentee.entity';
import { Mentor } from '../../mentor/entities/mentor.entity';

@Entity("tbl_tutor_rating")
export class Rating extends DbEntity implements IEntity
{

  @Column({ type: 'integer',  nullable: false })
  rate: number;

  @Column({ type: 'varchar',  nullable: true })
  comment?: string;

  @OneToOne(() => Session, m => m.rating)
  session: Session;

  @ManyToOne(() => Mentee)
  mentee: Mentee;

  @ManyToOne(() => Mentor, (mentor: Mentor) => mentor.rates)
  mentor: Mentor;

}
