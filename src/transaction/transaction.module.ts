import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletTransaction } from './entities/transaction.entity';
import { TransactionController } from './transaction.controller';
import { TransactionService } from './transaction.service';
import { TransactionSubscriber } from './subscribers/transaction.subscriber';
import { CqrsModule } from '@nestjs/cqrs';
import { TransactionEventHandler } from './wallet/events/transaction-event.handler';
import { ITransactionService } from './abstraction/service/i-transaction.service';
import { Wallet } from './wallet/entities/wallet.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([WalletTransaction, Wallet]),
    CqrsModule
  ],
  controllers: [TransactionController],
  providers: [
    TransactionService,
    TransactionSubscriber,
    TransactionEventHandler
  ],
  exports: [TransactionService]
})
export class TransactionModule {}
