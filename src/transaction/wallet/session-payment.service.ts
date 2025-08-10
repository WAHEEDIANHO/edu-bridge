import { Injectable, BadRequestException } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { BookingService } from '../../booking/booking.service';
import { SessionService } from '../../session/session.service';
import { PaymentDto } from './dto/payment.dto';

export interface SessionPaymentDto {
  sessionId: string;
  menteeAccountNo: string;
  mentorAccountNo: string;
  amount: number;
  description?: string;
}

@Injectable()
export class SessionPaymentService {
  constructor(
    private readonly walletService: WalletService,
    // private readonly bookingService: BookingService,
    private readonly sessionService: SessionService,
  ) {}

  async processSessionPayment(sessionPaymentDto: SessionPaymentDto): Promise<any> {
    // Verify session exists and is valid
    const session = await this.sessionService.findById(sessionPaymentDto.sessionId);
    if (!session) {
      throw new BadRequestException('Session not found');
    }

    // Check if mentee has sufficient balance
    const menteeBalance = await this.walletService.getWalletBalance(sessionPaymentDto.menteeAccountNo);
    if (menteeBalance < sessionPaymentDto.amount) {
      throw new BadRequestException('Insufficient balance for session payment');
    }

    // Process payment from mentee to mentor
    const paymentDto: PaymentDto = {
      fromAccountNo: sessionPaymentDto.menteeAccountNo,
      toAccountNo: sessionPaymentDto.mentorAccountNo,
      amount: sessionPaymentDto.amount,
      sessionId: sessionPaymentDto.sessionId,
      description: sessionPaymentDto.description || `Session payment for session ${sessionPaymentDto.sessionId}`,
    };

    const transaction = await this.walletService.makePayment(paymentDto);

    // Update session status to paid
    // This would depend on your session entity structure
    // await this.sessionService.updateSessionPaymentStatus(sessionPaymentDto.sessionId, 'paid');

    return {
      message: 'Session payment processed successfully',
      transaction,
      sessionId: sessionPaymentDto.sessionId,
      amount: sessionPaymentDto.amount,
    };
  }

  async getSessionPaymentHistory(sessionId: string): Promise<any> {
    // Get all transactions related to this session
    const { transactions } = await this.walletService.getTransactionHistory('');
    const sessionTransactions = transactions?.filter(
      (t) =>
        t.narration?.includes(sessionId) || t.transRef?.includes(sessionId),
    );

    return {
      sessionId,
      transactions: sessionTransactions,
      totalAmount: sessionTransactions.reduce(
        (sum, t) => sum + (t.crAmount || 0),
        0,
      ),
    };
  }

  async refundSessionPayment(sessionId: string, reason?: string): Promise<any> {
    // This would implement refund logic
    // For MVP, we'll just return a success message
    return {
      message: 'Refund request submitted successfully',
      sessionId,
      reason: reason || 'Session cancellation',
      status: 'pending',
    };
  }
} 