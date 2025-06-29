import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { MenteeLevel } from '../abstraction/enums/mentee-level.enum';

@Entity("tbl_mentees")
export class Mentee extends DbEntity implements IEntity {

  @Column({ type: 'varchar', nullable: true, enum: MenteeLevel })
  level: MenteeLevel;

  @Column({ type: 'varchar', nullable: true })
  preferredSubjects: string;

  @Column({ type: 'varchar', nullable: true })
  profilePictureUrl: string;

  @Column({ type: 'varchar', nullable: true })
  location: string;


  @OneToOne(() => User)
  @JoinColumn()
  user: User;
}
