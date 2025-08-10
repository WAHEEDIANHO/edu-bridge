import { Entity, Column, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm';
import { Wallet } from '../wallet/entities/wallet.entity';
import { DbEntity } from 'src/utils/abstract/database/db-entity';
import { IEntity } from 'src/utils/abstract/database/i-enity';

@Entity('tbl_walletTransaction')
export class WalletTransaction extends DbEntity implements IEntity {

  @Column({ nullable: false })
  @Index()
  transNo: string;

  @CreateDateColumn()
  @Index()
  transDate: Date;

  @Column({ nullable: false })
  @Index()
  transRef: string;

  @Column({ type: 'varchar' })
  @Index()
  customerAccountNo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  drAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  crAmount: number;

  @Column({ nullable: false })
  narration: string;

  @Column({ 
    type: 'enum', 
    enum: ['pending', 'completed', 'failed', 'approved', 'rejected'], 
    default: 'pending' 
  })
  status: string;

  @Column({ nullable: true })
  contact: string;

  @Column({ type: 'text', nullable: true })
  metadata?: string;

  @Column({
    type: 'enum',
    enum: [
      'DEPOSIT', 
      'WITHDRAWAL_REQUEST', 
      'WITHDRAWAL', 
      'PAYMENT', 
      'RECEIVED', 
      'REFUND',
      'BOOKING_PAYMENT',
      'SESSION_PAYMENT',
      'WALLET_CREATION'
    ]
  })
  @Index()
  type: string;

  @ManyToOne(() => Wallet, wallet => wallet.transactions)
  @JoinColumn({ name: 'customerAccountNo', referencedColumnName: 'accountNo' })
  wallet: Wallet;

  // Helper methods
  isPending(): boolean {
    return this.status === 'pending';
  }

  isCompleted(): boolean {
    return this.status === 'completed';
  }

  getAmount(): number {
    return this.crAmount > 0 ? this.crAmount : this.drAmount;
  }

  isCredit(): boolean {
    return this.crAmount > 0;
  }

  isDebit(): boolean {
    return this.drAmount > 0;
  }
}
