import { Column, Entity, Index, ManyToOne, JoinColumn } from 'typeorm';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { User } from '../../user/entities/user.entity';

@Entity('tbl_payment_methods')
export class PaymentMethod extends DbEntity implements IEntity {

  @ManyToOne(() => User, { eager: true })
  @JoinColumn({ name: 'userId', referencedColumnName: 'id' })
  user: User;

  @Column({ type: 'varchar', default: 'paystack' })
  gateway: 'paystack';

  @Column({ type: 'varchar' })
  @Index()
  authorizationCode: string;

  @Column({ type: 'varchar', nullable: true })
  cardBrand?: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  last4?: string;

  @Column({ type: 'varchar', length: 2, nullable: true })
  expMonth?: string;

  @Column({ type: 'varchar', length: 4, nullable: true })
  expYear?: string;

  @Column({ type: 'boolean', default: true })
  reusable: boolean;

  @Column({ type: 'boolean', default: false })
  isDefault: boolean;
}

