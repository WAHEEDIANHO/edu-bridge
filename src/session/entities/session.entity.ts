import { Column, Entity, JoinColumn, OneToOne } from 'typeorm';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { Booking } from '../../booking/entities/booking.entity';
import { AvailabilitySlot } from '../../availability-slot/entities/availability-slot.entity';
import { MenteeLevel } from '../../mentee/abstraction/enums/mentee-level.enum';

@Entity("tbl_session")
export class Session extends DbEntity implements IEntity
{

  @Column({ type: 'varchar', nullable: true })
  zoom_join_link: string;

  @Column({ type: 'varchar', nullable: true })
  zoom_start_link: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @Column({ type: 'boolean', default: false })
  completed: boolean;

  @Column({ type: 'time' })
  startTime: string; // e.g., 14:00:00

  @Column({ type: 'time' })
  endTime: string; // e.g., 15:00:00

  @Column({type: "int", nullable: true})
  no_of_participant_allow: number

  @Column({ type: 'varchar', enum: MenteeLevel })
  level: string

  @OneToOne(() => AvailabilitySlot)
  @JoinColumn()
  slot: AvailabilitySlot;
}

