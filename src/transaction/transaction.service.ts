import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WalletTransaction } from './entities/transaction.entity';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { GeneralService } from '../utils/abstract/service/general.service';
import { ITransactionService } from './abstraction/service/i-transaction.service';

@Injectable()
export class TransactionService extends GeneralService<WalletTransaction> implements ITransactionService {
  constructor(
    @InjectRepository(WalletTransaction) 
    private readonly transactionRepository: Repository<WalletTransaction>
  ) {
    super(transactionRepository);
  }

  // Override create method to include validation
  async create(data: WalletTransaction): Promise<boolean> {
    await this.validateTransaction(data);
    return super.create(data);
  }

  // Override update method to include validation
  async update(data: WalletTransaction): Promise<boolean> {
    await this.validateTransaction(data);
    return super.update(data);
  }

  // Manual synchronization method for wallet balance
  async synchronizeWalletBalance(accountNo: string): Promise<number> {
    const transactions = await this.transactionRepository.find({
      where: { customerAccountNo: accountNo },
      order: { transDate: 'ASC' }
    });

    const balance = transactions.reduce((sum, transaction) => {
      const drAmount = transaction.drAmount || 0;
      const crAmount = transaction.crAmount || 0;
      return sum - Number(drAmount) + Number(crAmount);
    }, 0);

    console.log(`Calculated balance for account ${accountNo}: ${balance}`);
    return balance;
  }

  // Get transaction history for an account
  async getTransactionHistory(accountNo: string): Promise<WalletTransaction[]> {
    return await this.transactionRepository.find({
      where: { customerAccountNo: accountNo },
      order: { transDate: 'DESC' }
    });
  }

  // Validate transaction before saving
  async validateTransaction(transaction: Partial<WalletTransaction>): Promise<boolean> {
    // Basic validation
    if (!transaction.customerAccountNo) {
      throw new Error('Customer account number is required');
    }

    if (!transaction.type) {
      throw new Error('Transaction type is required');
    }

    // Ensure either drAmount or crAmount is provided, but not both
    if (transaction.drAmount && transaction.crAmount) {
      throw new Error('Transaction cannot have both debit and credit amounts');
    }

    if (!transaction.drAmount && !transaction.crAmount) {
      throw new Error('Transaction must have either debit or credit amount');
    }

    return true;
  }

  // Get account summary with balance
  async getAccountSummary(accountNo: string): Promise<{
    accountNo: string;
    balance: number;
    totalTransactions: number;
    lastTransactionDate?: Date;
  }> {
    const transactions = await this.getTransactionHistory(accountNo);
    const balance = await this.synchronizeWalletBalance(accountNo);
    
    return {
      accountNo,
      balance,
      totalTransactions: transactions.length,
      lastTransactionDate: transactions[0]?.transDate
    };
  }

  // Get pending withdrawal requests
  async getPendingWithdrawals(): Promise<WalletTransaction[]> {
    return await this.transactionRepository.find({
      where: { 
        type: 'WITHDRAWAL_REQUEST',
        status: 'pending'
      },
      order: { transDate: 'DESC' }
    });
  }

  // Get transactions by type
  async getTransactionsByType(accountNo: string, type: string): Promise<WalletTransaction[]> {
    return await this.transactionRepository.find({
      where: { 
        customerAccountNo: accountNo,
        type: type
      },
      order: { transDate: 'DESC' }
    });
  }

  async getTransactionsByReference(accountNo: string, reference: string): Promise<WalletTransaction|null> {
    return await this.transactionRepository.findOne({
      where: { 
        customerAccountNo: accountNo,
        transRef: reference
      }
    });
  }

}
