import {
  Entity, Column, PrimaryGeneratedColumn, ManyToOne,
  CreateDateColumn, UpdateDateColumn, Index, Unique, JoinColumn, OneToOne,
} from 'typeorm';
import { Mentee } from '../../mentee/entities/mentee.entity';
import { Mentor } from '../../mentor/entities/mentor.entity';
import { AvailabilitySlot } from '../../availability-slot/entities/availability-slot.entity';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { Session } from '../../session/entities/session.entity';
import { Subject } from '../../admin/modules/subject/entities/subject.entity';

@Entity('tbl_bookings')
@Unique(["mentee", "mentor", "slot", "prefer_date"])
export class Booking extends DbEntity implements IEntity {

  @ManyToOne(() => Mentee, (mentee) => mentee.bookings)
  mentee: Mentee;

  @ManyToOne(() => Mentor)
  mentor: Mentor;

  @ManyToOne(() => AvailabilitySlot, (slot) => slot.bookings)
  slot: AvailabilitySlot;

  @Column({ type: 'enum', enum: ['pending', 'confirmed', 'cancelled', ], default: 'pending' })
  status: 'pending' | 'confirmed' | 'cancelled';

  @Column({ type: 'text', nullable: true })
  note?: string;

  @Column({ type: 'date' })
  prefer_date: Date;

  @Column({ type: 'time' })
  prefer_time: string; // e.g., '14:00:00'

  @Column({ type: 'float', default: 0.00 })
  duration: number; // Duration in minutes

  @ManyToOne(() => Subject, { eager: true })
  subject: Subject;

  // @OneToOne(() => Session, { cascade: true})
  // @JoinColumn()
  // session: Session;

}
