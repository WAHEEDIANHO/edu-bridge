import { Column, Entity, JoinColumn, OneToMany, OneToOne, Unique } from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { AvailabilityStatus } from '../abstraction/enum/availability-status.enum';
import { CompetencySubject } from './competency-subject.entity';
import { AvailabilitySlot } from '../../availability-slot/entities/availability-slot.entity';
import { Rating } from '../../rating/entities/rating.entity';

@Unique(['user'])
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
  @OneToOne(() => User, () => null, { onDelete: 'CASCADE', eager: true })
  @JoinColumn()
  user: User;

  @OneToMany(() => Rating, (rate: Rating) => rate.mentor)
  rates?: Rating[];


  @OneToMany(() => CompetencySubject,
    (competencySubject: CompetencySubject) => competencySubject.mentor,
    { cascade: true, orphanedRowAction: "delete" })
  competencySubjects?: CompetencySubject[];

  @OneToMany(() => AvailabilitySlot,
    (slot: AvailabilitySlot) => slot.mentor,
    { cascade: true, orphanedRowAction: "delete" })
  slots?: AvailabilitySlot[];
}
