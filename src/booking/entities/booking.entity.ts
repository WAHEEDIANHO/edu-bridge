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

@Entity('tbl_bookings')
@Unique(["mentee", "mentor", "slot"])
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

  @Column({ type: 'boolean', default: false })
  recurrent?: boolean;

  // @OneToOne(() => Session, { cascade: true})
  // @JoinColumn()
  // session: Session;

  @Column({ type: "int", nullable: false, })
  hours_booked: number
}
