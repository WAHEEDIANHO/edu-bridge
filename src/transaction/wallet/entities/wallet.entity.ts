import { WalletTransaction } from 'src/transaction/entities/transaction.entity';
import { DbEntity } from 'src/utils/abstract/database/db-entity';
import { IEntity } from 'src/utils/abstract/database/i-enity';
import { Entity, Column, OneToMany, Index } from 'typeorm';

@Entity('tbl__wallet')
export class Wallet extends DbEntity implements IEntity {

  @Column({ type: 'varchar', unique: true })
  @Index()
  accountNo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ nullable: true })
  customerName: string;

  @Column({ type: "varchar" })
  @Index()
  email: string;

  @Column({ type: "varchar" })
  @Index()
  customerId: string;

  @Column({ type: 'enum', enum: ['active', 'inactive', 'suspended'], default: 'active' })
  status: string;

  @OneToMany(() => WalletTransaction, transaction => transaction.wallet)
  transactions: WalletTransaction[];

  // Helper methods
  isActive(): boolean {
    return this.status === 'active';
  }

  canWithdraw(amount: number): boolean {
    return this.isActive() && this.balance >= amount;
  }
}