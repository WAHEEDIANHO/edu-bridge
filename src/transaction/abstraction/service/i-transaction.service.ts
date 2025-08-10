import { IGeneralService } from '../../../utils/abstract/service/i-general.service';
import { WalletTransaction } from '../../entities/transaction.entity';
import { CreateTransactionDto } from '../../dto/create-transaction.dto';
import { UpdateTransactionDto } from '../../dto/update-transaction.dto';

export interface ITransactionService extends IGeneralService<WalletTransaction> {
  // Transaction-specific methods
  synchronizeWalletBalance(accountNo: string): Promise<number>;
  getTransactionHistory(accountNo: string): Promise<WalletTransaction[]>;
  getAccountSummary(accountNo: string): Promise<{
    accountNo: string;
    balance: number;
    totalTransactions: number;
    lastTransactionDate?: Date;
  }>;
  validateTransaction(transaction: Partial<WalletTransaction>): Promise<boolean>;
} 