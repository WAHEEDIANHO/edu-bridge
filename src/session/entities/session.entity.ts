import { Column, Entity, JoinColumn, ManyToOne, OneToOne } from 'typeorm';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { Booking } from '../../booking/entities/booking.entity';
import { AvailabilitySlot } from '../../availability-slot/entities/availability-slot.entity';
import { MenteeLevel } from '../../mentee/abstraction/enums/mentee-level.enum';
import { Mentee } from '../../mentee/entities/mentee.entity';
import { Mentor } from '../../mentor/entities/mentor.entity';
import { Rating } from '../../rating/entities/rating.entity';

@Entity("tbl_session")
export class Session extends DbEntity implements IEntity
{

  @Column({ type: 'varchar', nullable: true })
  zoom_join_link: string;

  @Column({ type: 'varchar', nullable: true })
  zoom_start_link: string;

  @Column({ type: 'varchar' })
  mentor_name: string;

  @Column({ type: 'varchar' })
  mentee_name: string;

  @Column({ type: 'varchar', nullable: true })
  session_subject: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'boolean', default: false })
  rated: boolean;

  @Column({ type: 'date' })
  session_date: Date;

  @Column({ type: 'time' })
  startTime: string; // e.g., 14:00:00

  @Column({ type: 'time' })
  endTime: string; // e.g., 15:00:00

  @ManyToOne(() => Mentee)
  mentee: Mentee;

  @ManyToOne(() => Mentor)
  mentor: Mentor;

  @OneToOne(() => Booking)
  @JoinColumn()
  booking: Booking;

  @OneToOne(() => Rating)
  @JoinColumn()
  rating: Rating
}

