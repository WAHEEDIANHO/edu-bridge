import { Mentor } from 'src/mentor/entities/mentor.entity';
import {
  Entity, Column, PrimaryGeneratedColumn,
  ManyToOne, CreateDateColumn, Index, Unique, OneToMany, JoinColumn, OneToOne,
} from 'typeorm';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { DayOfWeek } from '../abstraction/enums/day-of-week.enum';
import { Booking } from '../../booking/entities/booking.entity';
import { MenteeLevel } from '../../mentee/abstraction/enums/mentee-level.enum';
import { Session } from '../../session/entities/session.entity';

@Entity('tbl_availability_slots')
@Unique("mentor-day-level",["mentor", "day", "level"])
@Unique("mentor-startTime-day", ["mentor", "startTime", "day"])
@Unique("mentor-endTIme-day", ["mentor", "endTime", "day"])
export class AvailabilitySlot extends DbEntity implements IEntity{

  @ManyToOne(() => Mentor, { onDelete: 'CASCADE' })
  mentor: Mentor;

  @OneToOne(() => Session, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn()
  session?: Session

  @Column({type: "int", nullable: true})
  no_of_participant_allow: number

  @Column({ type: 'varchar', enum: DayOfWeek })
  day: string;

  @Column({ type: 'time' })
  startTime: string; // e.g., 14:00:00

  @Column({ type: 'time' })
  endTime: string; // e.g., 15:00:00

  // @Column({ type: 'boolean', default: true })
  // available: boolean;

  @Column({ type: 'varchar', enum: MenteeLevel })
  level: string

  @Column({ type: 'boolean', default: true })
  is_open_for_booking: boolean;

  @OneToMany(() => Booking, (booking) => booking.slot)
  bookings: Booking[];
}

