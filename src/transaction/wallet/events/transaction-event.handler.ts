import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TransactionEvent } from '../../abstraction/event/transaction.event';
import { Injectable, Inject } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Wallet } from '../entities/wallet.entity';

@Injectable()
@EventsHandler(TransactionEvent)
export class TransactionEventHandler implements IEventHandler<TransactionEvent> {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet> // Will be properly typed when Wallet entity is created
  ) {}

  async handle(event: TransactionEvent) {
    const { transaction, operation, walletAccountNo } = event;
    
    try {
      switch (operation) {
        case 'CREATE':
          await this.handleTransactionCreated(transaction, walletAccountNo);
          break;
        case 'UPDATE':
          await this.handleTransactionUpdated(transaction, walletAccountNo);
          break;
        case 'DELETE':
          await this.handleTransactionDeleted(transaction, walletAccountNo);
          break;
      }
    } catch (error) {
      console.error(`Error handling transaction event: ${error.message}`);
      // In production, you might want to log this to a monitoring service
      throw error;
    }
  }

  private async handleTransactionCreated(transaction: any, accountNo: string) {
    // Find or create wallet
    let wallet = await this.walletRepository.findOne({ where: { accountNo } });
    
    if (!wallet) {
      // Create wallet if it doesn't exist
      wallet = this.walletRepository.create({
        accountNo,
        balance: 0,
        status: 'active'
      });
    }

    // Calculate new balance
    const amount = (transaction.drAmount || 0) - (transaction.crAmount || 0);
    wallet.balance += amount;

    await this.walletRepository.save(wallet);
    console.log(`Wallet balance updated for account ${accountNo}: ${wallet.balance}`);
  }

  private async handleTransactionUpdated(transaction: any, accountNo: string) {
    // For updates, we need to recalculate the entire balance from all transactions
    await this.recalculateWalletBalance(accountNo);
  }

  private async handleTransactionDeleted(transaction: any, accountNo: string) {
    // For deletions, recalculate the entire balance
    await this.recalculateWalletBalance(accountNo);
  }

  private async recalculateWalletBalance(accountNo: string) {
    // This would need to be implemented when you have the transaction repository
    // For now, it's a placeholder that shows the concept
    console.log(`Recalculating balance for account: ${accountNo}`);
    
    // Example implementation:
    // const transactions = await this.transactionRepository.find({
    //   where: { customerAccountNo: accountNo }
    // });
    // 
    // const balance = transactions.reduce((sum, trans) => {
    //   return sum + (trans.drAmount || 0) - (trans.crAmount || 0);
    // }, 0);
    // 
    // const wallet = await this.walletRepository.findOne({ where: { accountNo } });
    // if (wallet) {
    //   wallet.balance = balance;
    //   await this.walletRepository.save(wallet);
    // }
  }
}