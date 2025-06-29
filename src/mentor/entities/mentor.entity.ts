import { Column, Entity, JoinColumn, OneToMany, OneToOne } from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { Rate } from './rate.entity';
import { AvailabilityStatus } from '../abstraction/enum/availability-status.enum';

@Entity("tbl_mentors")
export class Mentor extends DbEntity implements IEntity {

  @Column({ type: 'varchar', nullable: false })
  subject: string;

  @Column({ type: 'varchar', nullable: false })
  introVideoUrl: string;

  @Column({ type: 'text', nullable: true })
  bio: string;

  @Column({ type: 'varchar', nullable: true })
  ratePerHour: number;

  @Column({ type: 'varchar', nullable: true, enum: AvailabilityStatus })
  availability: AvailabilityStatus;

  @Column({ type: 'varchar', nullable: true })
  profilePictureUrl: string;

  @Column({ type: 'varchar', nullable: true })
  location: string;

  @Column({ type: 'boolean', default: false })
  isVerified: boolean;


  //relationships
  @OneToOne(() => User)
  @JoinColumn()
  user: User;

  @OneToMany(() => Rate, (rate: Rate) => rate.mentor)
  rates?: Rate[];
}
