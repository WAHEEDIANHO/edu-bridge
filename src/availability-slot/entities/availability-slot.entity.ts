import { Mentor } from 'src/mentor/entities/mentor.entity';
import {
  Entity, Column, PrimaryGeneratedColumn,
  ManyToOne, CreateDateColumn, Index, Unique, OneToMany, JoinColumn, OneToOne, PrimaryColumn, UpdateDateColumn,
} from 'typeorm';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { DayOfWeek } from '../abstraction/enums/day-of-week.enum';
import { Booking } from '../../booking/entities/booking.entity';
import { MenteeLevel } from '../../mentee/abstraction/enums/mentee-level.enum';
import { Session } from '../../session/entities/session.entity';

@Entity('tbl_availability_slots')
@Unique("mentor-day",["mentor", "day"])
export class AvailabilitySlot extends DbEntity implements IEntity{

  // declare id: string;

  // @PrimaryColumn({ type: 'uuid' })
  // mentorId: string;

  @ManyToOne(() => Mentor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mentorId' })
  mentor: Mentor;

  @Column({ type: 'varchar', length: 64 })
  @Column({ type: 'varchar', enum: DayOfWeek })
  day: string;

  @Column({ type: 'time' })
  startTime: string; // e.g., 14:00:00

  @Column({ type: 'time' })
  endTime: string; // e.g., 15:00:00

  // @CreateDateColumn()
  // createdAt?: Date;
  // @UpdateDateColumn()
  // updatedAt?: Date;


  @OneToMany(() => Booking, (booking) => booking.slot)
  bookings: Booking[];


}

