import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { User } from '../../user/entities/user.entity';
import { Booking } from '../../booking/entities/booking.entity';

@Entity('tbl_payments')
export class Payment extends DbEntity implements IEntity {

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  @ManyToOne(() => Booking, { eager: true, nullable: true })
  @JoinColumn({ name: 'bookingId', referencedColumnName: 'id' })
  booking?: Booking;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ type: 'varchar', default: 'card' })
  method: 'card' | 'wallet';

  @Column({ type: 'varchar', nullable: true })
  @Index()
  reference?: string;

  @Column({ type: 'varchar', nullable: true })
  gatewayRef?: string;

  @Column({ type: 'enum', enum: ['pending', 'completed', 'failed'], default: 'pending' })
  status: 'pending' | 'completed' | 'failed';

  @Column({ type: 'text', nullable: true })
  metadata?: string;
}
