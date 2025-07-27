import { Column, Entity, JoinColumn, OneToMany, OneToOne, Unique } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { MenteeLevel } from '../abstraction/enums/mentee-level.enum';
import { Booking } from '../../booking/entities/booking.entity';
import { MenteeSubject } from './mentee_subject.entity';

@Entity("tbl_mentees")
@Unique(["user"])
export class Mentee extends DbEntity implements IEntity {

  @Column({ type: 'varchar', nullable: true, enum: MenteeLevel })
  level: MenteeLevel;

  // @Column({ type: 'varchar', nullable: true })
  // preferredSubjects: string;

  @OneToMany(() => MenteeSubject, (menteeSubject) => menteeSubject.mentee, { cascade: true })
  preferredSubjects: MenteeSubject[];

  @Column({ type: 'varchar', nullable: true })
  profilePictureUrl: string;

  @Column({ type: 'varchar', nullable: true })
  location: string;


  @OneToOne(() => User, () => null, { onDelete: 'CASCADE', eager: true } )
  @JoinColumn()
  user: User;

  @OneToMany(() => Booking, (booking) => booking.mentee)
  bookings: Booking[];
}
