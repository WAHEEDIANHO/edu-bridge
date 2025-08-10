# Wallet System - Edu-Bridge MVP

## Overview

The wallet system provides a complete financial infrastructure for the Edu-Bridge platform, enabling mentees to fund their wallets and make payments for sessions, while mentors can receive payments and request withdrawals.

## Features

### Core Wallet Operations
- **Automatic Wallet Creation**: Wallets are automatically created during mentor and mentee onboarding
- **Wallet Funding**: Fund wallets with various payment methods
- **Balance Management**: Real-time balance tracking and synchronization
- **Transaction History**: Complete transaction logging and history

### Payment System
- **Session Payments**: Process payments from mentees to mentors for sessions
- **Payment Validation**: Ensure sufficient balance before processing payments
- **Transaction Tracking**: Link payments to specific sessions

### Withdrawal System
- **Withdrawal Requests**: Mentors can request withdrawals from their wallets
- **Admin Approval**: Admins can approve or reject withdrawal requests
- **Bank Integration**: Support for bank account details in withdrawal requests

## API Endpoints

### Wallet Management

#### Automatic Wallet Creation
Wallets are automatically created during user onboarding:

**Mentor Registration:**
```http
POST /mentor/register
```
- Automatically creates a wallet for the mentor
- Wallet account number is generated automatically
- Initial balance is set to 0

**Mentee Registration:**
```http
POST /mentee/register
```
- Automatically creates a wallet for the mentee
- Wallet account number is generated automatically
- Initial balance is set to 0

#### Manual Wallet Creation (if needed)
```http
POST /wallet/create
```
**Body:**
```json
{
  "customerName": "John Doe",
  "userId": "user123",
  "userType": "mentee"
}
```

#### Get Wallet Balance
```http
GET /wallet/balance/{accountNo}
```

#### Get Wallet Details
```http
GET /wallet/details/{accountNo}
```

#### Get User's Wallet
```http
GET /wallet/user/{userId}
```
Returns wallet information for a specific user (mentor or mentee)

#### Get Transaction History
```http
GET /wallet/transactions/{accountNo}
```

### Funding Operations

#### Fund Wallet
```http
POST /wallet/fund
```
**Body:**
```json
{
  "accountNo": "WAL123456789",
  "amount": 5000,
  "paymentMethod": "card",
  "reference": "PAY123456789"
}
```

### Payment Operations

#### Make Payment
```http
POST /wallet/payment
```
**Body:**
```json
{
  "fromAccountNo": "WAL123456789",
  "toAccountNo": "WAL987654321",
  "amount": 2500,
  "sessionId": "session123",
  "description": "Math tutoring session payment"
}
```

### Withdrawal Operations

#### Request Withdrawal
```http
POST /wallet/withdraw/request
```
**Body:**
```json
{
  "accountNo": "WAL987654321",
  "amount": 10000,
  "bankDetails": {
    "accountName": "John Doe",
    "accountNumber": "1234567890",
    "bankName": "First Bank of Nigeria"
  },
  "reason": "Need funds for personal use"
}
```

#### Approve Withdrawal (Admin Only)
```http
POST /wallet/withdraw/approve/{transactionId}
```

#### Reject Withdrawal (Admin Only)
```http
POST /wallet/withdraw/reject/{transactionId}
```
**Body:**
```json
{
  "reason": "Insufficient documentation"
}
```

#### Get Pending Withdrawals (Admin Only)
```http
GET /wallet/withdrawals/pending
```

## Demo Endpoints

For MVP testing and demonstration purposes, the following demo endpoints are available:

### Setup Demo Wallets
```http
POST /demo/wallet/setup-demo
```
Creates demo wallets for testing with initial funding.

### Demo Session Payment
```http
POST /demo/wallet/demo-session-payment
```
**Body:**
```json
{
  "menteeAccountNo": "WAL123456789",
  "mentorAccountNo": "WAL987654321",
  "amount": 2500,
  "sessionId": "demo-session-123"
}
```

### Demo Wallet Summary
```http
GET /demo/wallet/demo-summary/{accountNo}
```

### Demo Transaction History
```http
GET /demo/wallet/demo-transactions/{accountNo}
```

### Demo Fund Wallet
```http
POST /demo/wallet/demo-fund-wallet
```

### Demo Wallet Balance
```http
GET /demo/wallet/demo-wallet-balance/{accountNo}
```

### Test Onboarding with Wallet Creation
```http
POST /demo/wallet/test-onboarding
```
Tests the complete onboarding flow with automatic wallet creation for both mentors and mentees.

## Database Schema

### Wallet Entity
```typescript
@Entity('tbl_Wallet')
export class Wallet {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 20, unique: true })
  accountNo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  balance: number;

  @Column({ nullable: true })
  customerName: string;

  @Column({ nullable: true })
  status: string;

  @OneToMany(() => WalletTransaction, transaction => transaction.wallet)
  transactions: WalletTransaction[];
}
```

### Transaction Entity
```typescript
@Entity('tbl_WalletTransaction')
export class WalletTransaction {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ nullable: true })
  transNo: string;

  @CreateDateColumn({ nullable: true })
  transDate: Date;

  @Column({ nullable: true })
  transRef: string;

  @Column({ length: 20 })
  customerAccountNo: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  drAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  crAmount: number;

  @Column({ nullable: true })
  narration: string;

  @Column({ nullable: true })
  status: string;

  @Column()
  type: string;

  @ManyToOne(() => Wallet, wallet => wallet.transactions)
  @JoinColumn({ name: 'customerAccountNo' })
  wallet: Wallet;
}
```

## Transaction Types

- **DEPOSIT**: Wallet funding transactions
- **PAYMENT**: Outgoing payment transactions
- **RECEIVED**: Incoming payment transactions
- **WITHDRAWAL_REQUEST**: Pending withdrawal requests
- **WITHDRAWAL_APPROVED**: Approved withdrawal transactions
- **WITHDRAWAL_REJECTED**: Rejected withdrawal transactions

## Status Values

- **completed**: Successfully processed transactions
- **pending**: Pending approval (for withdrawals)
- **approved**: Approved by admin
- **rejected**: Rejected by admin

## Security Features

- **Authentication**: All endpoints require authentication
- **Role-based Access**: Admin-only endpoints for withdrawal management
- **Balance Validation**: Prevents overdrawing from wallets
- **Transaction Integrity**: Ensures atomic operations for payments

## Integration Points

### Session Payment Integration
The wallet system integrates with the session system to:
- Process payments when sessions are confirmed
- Track payment status for sessions
- Handle refunds for cancelled sessions

### Booking System Integration
- Links payments to specific bookings
- Updates booking status based on payment completion
- Provides payment history for bookings

## Future Enhancements

1. **Third-party Payment Integration**: Integrate with payment gateways like Paystack, Flutterwave
2. **Automated Withdrawals**: Direct bank transfers for approved withdrawals
3. **Payment Analytics**: Detailed reporting and analytics
4. **Multi-currency Support**: Support for different currencies
5. **Escrow System**: Hold payments until session completion
6. **Commission System**: Platform fee deduction from payments

## Testing

Use the demo endpoints to test the complete wallet flow:

1. **Test Onboarding**: Test automatic wallet creation during registration
2. **Setup Demo**: Create test wallets
3. **Fund Wallet**: Add funds to mentee wallet
4. **Session Payment**: Process payment from mentee to mentor
5. **Withdrawal Request**: Request withdrawal from mentor wallet
6. **Admin Approval**: Approve withdrawal (admin only)

### Onboarding Flow
1. **Mentor Registration**: `POST /mentor/register` - Creates mentor account + wallet
2. **Mentee Registration**: `POST /mentee/register` - Creates mentee account + wallet
3. **Fund Mentee Wallet**: Add funds for session payments
4. **Book Session**: Create booking between mentee and mentor
5. **Process Payment**: Transfer funds from mentee to mentor wallet
6. **Withdrawal Request**: Mentor requests withdrawal from their wallet

## Error Handling

The system includes comprehensive error handling for:
- Insufficient balance
- Invalid account numbers
- Duplicate transactions
- Invalid withdrawal requests
- Network errors

## Performance Considerations

- **Balance Caching**: Wallet balances are cached for performance
- **Transaction Batching**: Multiple transactions can be processed in batches
- **Database Indexing**: Optimized queries for transaction history
- **Connection Pooling**: Efficient database connection management 