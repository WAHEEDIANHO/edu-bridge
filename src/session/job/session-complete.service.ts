import { PaginationQueryDto } from '../../utils/dto/pagination-query.dto';
import { WalletTransaction } from '../../transaction/entities/transaction.entity';
import { Wallet } from '../../transaction/wallet/entities/wallet.entity';
import { SessionService } from '../session.service';
import { WalletService } from '../../transaction/wallet/wallet.service';
import { TransactionService } from '../../transaction/transaction.service';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Session } from '../entities/session.entity';
import { Job, Queue } from 'bull';

@Processor('payment')
export class SessionCompleteService {

  constructor(
    private readonly sessionService: SessionService,
    private readonly walletService: WalletService,
    private readonly transactionService: TransactionService,
  ) {}

  @Process('process-tutor-payment')
  async processTutorPayment(job: Job<{ session: Session }>) {
    console.log('=========================Processing Tutor payment in After 2hrs on Queue====================');
    try {
      // Find the booking payment transaction
      const bookingTransactions = await this.transactionService.findAll({
        type: 'BOOKING_PAYMENT',
        transRef: `BOOKING-${ job.data.session.booking.id}`
      } as PaginationQueryDto<WalletTransaction>);

      if (bookingTransactions && bookingTransactions.data && bookingTransactions.data.length > 0) {
        const bookingTransaction = bookingTransactions.data[0];

        // Extract payment details from transaction metadata
        if (bookingTransaction.metadata) {
          const metadata = JSON.parse(bookingTransaction.metadata);

          if (metadata.pendingCredit && metadata.mentorWalletAccountNo && metadata.amount) {
            // Use a database transaction to ensure atomicity
            const queryRunner = this.walletService.getDataSource().createQueryRunner();
            await queryRunner.connect();
            await queryRunner.startTransaction();

            try {
              // Credit mentor's wallet
              const creditTransaction = new WalletTransaction();
              creditTransaction.customerAccountNo = metadata.mentorWalletAccountNo;
              creditTransaction.crAmount = metadata.amount;
              creditTransaction.drAmount = 0;
              creditTransaction.type = 'SESSION_PAYMENT';
              creditTransaction.narration = `Payment for completed session #${job.data.session.id}`;
              creditTransaction.status = 'completed';
              creditTransaction.transRef = `SESSION-${job.data.session.id}`;
              creditTransaction.transNo = `TR${Date.now()}${Math.floor(Math.random() * 10000)}`;

              // Save transaction within the transaction context
              await queryRunner.manager.save(creditTransaction);

              // Update wallet balance within the transaction context
              const wallet = await queryRunner.manager.findOne(Wallet, {
                where: { accountNo: metadata.mentorWalletAccountNo }
              });

              if (!wallet) {
                throw new Error(`Wallet with account number ${metadata.mentorWalletAccountNo} not found`);
              }

              // Calculate current balance
              const transactions = await queryRunner.manager.find(WalletTransaction, {
                where: { customerAccountNo: metadata.mentorWalletAccountNo }
              });

              const currentBalance = transactions.reduce((sum, tx) => {
                const drAmount = tx.drAmount || 0;
                const crAmount = tx.crAmount || 0;
                return sum - Number(drAmount) + Number(crAmount);
              }, 0);

              // Update wallet balance
              wallet.balance = currentBalance + metadata.amount;
              await queryRunner.manager.save(wallet);

              // Update the original transaction metadata to mark credit as processed
              bookingTransaction.metadata = JSON.stringify({
                ...metadata,
                pendingCredit: false,
                creditedAt: new Date().toISOString(),
                sessionId: job.data.session.id
              });

              await queryRunner.manager.save(bookingTransaction);

              // Commit the transaction
              await queryRunner.commitTransaction();
            } catch (error) {
              // Rollback the transaction in case of error
              await queryRunner.rollbackTransaction();
              throw error;
            } finally {
              // Release the query runner
              await queryRunner.release();
            }
          }
        }
      }
    } catch (error) {
      console.error('Error processing mentor payment:', error);
      // We don't want to fail the session completion if payment processing fails
      // But we should log the error for investigation
    }
  }
}
