import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent, RemoveEvent } from 'typeorm';
import { WalletTransaction } from '../entities/transaction.entity';
import { TransactionEvent } from '../abstraction/event/transaction.event';
import { Injectable } from '@nestjs/common';
import { EventBus } from '@nestjs/cqrs';

@Injectable()
export class TransactionSubscriber implements EntitySubscriberInterface<WalletTransaction> {
  constructor(private readonly eventBus: EventBus) {}

  listenTo() {
    return WalletTransaction;
  }

  async afterInsert(event: InsertEvent<WalletTransaction>) {
    const transaction = event.entity as WalletTransaction;
    if (transaction) {
      console.log(`Transaction created: ${transaction.transNo} for account: ${transaction.customerAccountNo}`);
      this.eventBus.publish(new TransactionEvent(transaction, 'CREATE', transaction.customerAccountNo));
    }
  }

  async afterUpdate(event: UpdateEvent<WalletTransaction>) {
    const transaction = event.entity as WalletTransaction;
    if (transaction) {
      console.log(`Transaction updated: ${transaction.transNo} for account: ${transaction.customerAccountNo}`);
      this.eventBus.publish(new TransactionEvent(transaction, 'UPDATE', transaction.customerAccountNo));
    }
  }

  async afterRemove(event: RemoveEvent<WalletTransaction>) {
    const transaction = event.entity as WalletTransaction;
    if (transaction) {
      console.log(`Transaction deleted: ${transaction.transNo} for account: ${transaction.customerAccountNo}`);
      this.eventBus.publish(new TransactionEvent(transaction, 'DELETE', transaction.customerAccountNo));
    }
  }
} 