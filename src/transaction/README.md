# Wallet-Transaction Synchronization Strategy

## Overview

This module implements a robust synchronization strategy between Wallet and Transaction entities using an event-driven architecture with TypeORM subscribers and CQRS events. The service follows the established pattern of extending `GeneralService` and implementing `ITransactionService`.

## Architecture

### 1. Service Pattern

```
ITransactionService (Interface)
         ↑
GeneralService<WalletTransaction>
         ↑
TransactionService (Implementation)
```

### 2. Event-Driven Synchronization

```
Transaction Created/Updated/Deleted
         ↓
   TransactionSubscriber
         ↓
   TransactionEvent Published
         ↓
   TransactionEventHandler
         ↓
   Wallet Balance Updated
```

### 3. Components

#### Transaction Entity (`transaction.entity.ts`)
- Extends `DbEntity` for consistent base fields
- Contains transaction details (amounts, dates, references)
- Links to wallet via `customerAccountNo`

#### Transaction Service (`transaction.service.ts`)
- Extends `GeneralService<WalletTransaction>`
- Implements `ITransactionService`
- Provides transaction-specific methods for wallet synchronization
- Includes validation and business logic

#### Transaction Subscriber (`subscribers/transaction.subscriber.ts`)
- Listens to all transaction operations (INSERT, UPDATE, DELETE)
- Publishes events for wallet synchronization
- Handles logging and error tracking

#### Transaction Event Handler (`wallet/events/transaction-event.handler.ts`)
- Processes transaction events
- Updates wallet balances automatically
- Handles wallet creation if needed
- Recalculates balances for updates/deletions

## Usage

### Automatic Synchronization

Transactions automatically trigger wallet balance updates:

```typescript
// Create a transaction - wallet balance updates automatically
const transaction = new WalletTransaction();
Object.assign(transaction, {
  customerAccountNo: 'ACC001',
  drAmount: 100,
  type: 'DEPOSIT',
  narration: 'Initial deposit'
});

await transactionService.create(transaction);
```

### Manual Synchronization

For data integrity checks or manual balance recalculation:

```typescript
// Recalculate wallet balance manually
const balance = await transactionService.synchronizeWalletBalance('ACC001');

// Get account summary
const summary = await transactionService.getAccountSummary('ACC001');
```

### Transaction Validation

All transactions are validated before saving:

```typescript
// Valid transaction
const transaction = new WalletTransaction();
Object.assign(transaction, {
  customerAccountNo: 'ACC001',
  drAmount: 100,  // Debit amount
  type: 'DEPOSIT'
});

await transactionService.create(transaction);

// Invalid transaction (both debit and credit)
const invalidTransaction = new WalletTransaction();
Object.assign(invalidTransaction, {
  customerAccountNo: 'ACC001',
  drAmount: 100,
  crAmount: 50,   // Error: Cannot have both
  type: 'TRANSFER'
});
// This will throw an error
```

## API Endpoints

### Standard CRUD Operations
- `POST /transaction` - Create transaction
- `GET /transaction` - Get all transactions (with pagination)
- `GET /transaction/:id` - Get transaction by ID
- `PATCH /transaction/:id` - Update transaction
- `DELETE /transaction/:id` - Delete transaction

### Transaction-Specific Operations
- `GET /transaction/account/:accountNo/history` - Get transaction history
- `GET /transaction/account/:accountNo/summary` - Get account summary
- `GET /transaction/account/:accountNo/balance` - Get wallet balance

## Best Practices

### 1. Data Integrity
- Always use the service methods for CRUD operations
- Let the event system handle wallet updates automatically
- Use manual synchronization for audit purposes

### 2. Error Handling
- Events are processed asynchronously
- Failed events are logged but don't block transactions
- Manual synchronization available for recovery

### 3. Performance
- Balance calculations are incremental for new transactions
- Full recalculation for updates/deletions
- Consider caching for high-frequency accounts

### 4. Monitoring
- All synchronization events are logged
- Monitor event processing times
- Set up alerts for failed synchronizations

## Configuration

### Module Setup
```typescript
@Module({
  imports: [
    TypeOrmModule.forFeature([WalletTransaction]),
    CqrsModule
  ],
  providers: [
    TransactionService,
    TransactionSubscriber,
    TransactionEventHandler
  ]
})
```

### Service Pattern
```typescript
@Injectable()
export class TransactionService extends GeneralService<WalletTransaction> 
  implements ITransactionService {
  
  constructor(
    @InjectRepository(WalletTransaction) 
    private readonly transactionRepository: Repository<WalletTransaction>
  ) {
    super(transactionRepository);
  }
  
  // Override methods with validation
  async create(data: WalletTransaction): Promise<boolean> {
    await this.validateTransaction(data);
    return super.create(data);
  }
}
```

## Troubleshooting

### Common Issues

1. **Wallet not updating**: Check if CQRS events are enabled
2. **Balance mismatch**: Use `synchronizeWalletBalance()` to recalculate
3. **Event not firing**: Verify subscriber is registered in module

### Debug Commands

```typescript
// Check transaction history
const history = await transactionService.getTransactionHistory('ACC001');

// Verify balance calculation
const balance = await transactionService.synchronizeWalletBalance('ACC001');

// Get account summary
const summary = await transactionService.getAccountSummary('ACC001');
```

## Future Enhancements

1. **Batch Processing**: For bulk transaction imports
2. **Caching**: Redis cache for frequently accessed balances
3. **Audit Trail**: Detailed logging of all balance changes
4. **Real-time Updates**: WebSocket notifications for balance changes 