import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { SessionPaymentService } from './session-payment.service';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { PaymentDto } from './dto/payment.dto';
import { WithdrawRequestDto } from './dto/withdraw-request.dto';

@Controller('demo/wallet')
export class DemoWalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly sessionPaymentService: SessionPaymentService,
  ) {}

  @Post('setup-demo')
  async setupDemoWallets() {
    // Create demo wallets for testing
    const menteeWallet = await this.walletService.createWallet({
      customerName: 'Demo Mentee',
      userId: 'mentee123',
      userType: 'mentee',
      customerId: '',
      email: '',
    });

    const mentorWallet = await this.walletService.createWallet({
      customerName: 'Demo Mentor',
      userId: 'mentor123',
      userType: 'mentor',
      customerId: '',
      email: '',
    });

    // Fund mentee wallet
    await this.walletService.fundWallet({
      accountNo: menteeWallet.accountNo,
      amount: 10000,
      paymentMethod: 'demo',
      reference: 'DEMO_FUND_001',
      path: "/demo/wallet/setup-demo",
    });

    return {
      message: 'Demo wallets created successfully',
      menteeWallet: {
        accountNo: menteeWallet.accountNo,
        customerName: menteeWallet.customerName,
        balance: await this.walletService.getWalletBalance(
          menteeWallet.accountNo,
        ),
      },
      mentorWallet: {
        accountNo: mentorWallet.accountNo,
        customerName: mentorWallet.customerName,
        balance: await this.walletService.getWalletBalance(
          mentorWallet.accountNo,
        ),
      },
    };
  }

  @Post('demo-session-payment')
  async demoSessionPayment(
    @Body()
    body: {
      menteeAccountNo: string;
      mentorAccountNo: string;
      amount: number;
      sessionId?: string;
    },
  ) {
    const sessionPaymentDto = {
      sessionId: body.sessionId || 'demo-session-123',
      menteeAccountNo: body.menteeAccountNo,
      mentorAccountNo: body.mentorAccountNo,
      amount: body.amount,
      description: 'Demo session payment',
    };

    return await this.sessionPaymentService.processSessionPayment(
      sessionPaymentDto,
    );
  }

  @Post('demo-withdrawal-request')
  async demoWithdrawalRequest(@Body() withdrawRequestDto: WithdrawRequestDto) {
    return await this.walletService.requestWithdrawal(withdrawRequestDto);
  }

  @Get('demo-summary/:accountNo')
  async getDemoSummary(@Param('accountNo') accountNo: string) {
    const wallet = await this.walletService.getWallet(accountNo);
    const balance = await this.walletService.getWalletBalance(accountNo);
    const { transactions } =
      await this.walletService.getTransactionHistory(accountNo);

    return {
      accountNo,
      customerName: wallet.customerName,
      currentBalance: balance,
      currency: 'NGN',
      totalTransactions: transactions.length,
      recentTransactions: transactions.slice(0, 5).map((t) => ({
        id: t.id,
        type: t.type,
        amount: t.crAmount || t.drAmount,
        narration: t.narration,
        date: t.transDate,
        status: t.status,
      })),
      demo: true,
    };
  }

  @Get('demo-transactions/:accountNo')
  async getDemoTransactions(@Param('accountNo') accountNo: string) {
    const { transactions  } = await this.walletService.getTransactionHistory(accountNo);

    return {
      accountNo,
      transactions: transactions.map((t) => ({
        id: t.id,
        type: t.type,
        credit: t.crAmount || 0,
        debit: t.drAmount || 0,
        narration: t.narration,
        date: t.transDate,
        status: t.status,
        reference: t.transRef,
      })),
      totalTransactions: transactions.length,
      demo: true,
    };
  }

  @Post('demo-fund-wallet')
  async demoFundWallet(@Body() fundWalletDto: FundWalletDto) {
    const { transaction } = await this.walletService.fundWallet(fundWalletDto);
    const newBalance = await this.walletService.getWalletBalance(
      fundWalletDto.accountNo,
    );

    return {
      message: 'Demo: Wallet funded successfully',
      transaction: {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.crAmount,
        narration: transaction.narration,
        date: transaction.transDate,
        status: transaction.status,
      },
      newBalance,
      currency: 'NGN',
      demo: true,
    };
  }

  @Get('demo-wallet-balance/:accountNo')
  async getDemoWalletBalance(@Param('accountNo') accountNo: string) {
    const balance = await this.walletService.getWalletBalance(accountNo);
    const wallet = await this.walletService.getWallet(accountNo);

    return {
      accountNo,
      customerName: wallet.customerName,
      balance,
      currency: 'NGN',
      demo: true,
    };
  }

  @Post('test-onboarding')
  async testOnboarding() {
    // Test mentor onboarding with wallet creation
    const mentorWallet = await this.walletService.createWallet({
      customerName: 'Test Mentor',
      userId: 'mentor-test-123',
      userType: 'mentor',
      customerId: '',
      email: 'test@gmail.com',
    });

    // Test mentee onboarding with wallet creation
    const menteeWallet = await this.walletService.createWallet({
      customerName: 'Test Mentee',
      userId: 'mentee-test-123',
      userType: 'mentee',
      customerId: '',
      email: 'test@gmail.com',
    });

    // Fund mentee wallet for testing
    await this.walletService.fundWallet({
      accountNo: menteeWallet.accountNo,
      amount: 5000,
      paymentMethod: 'test',
      reference: 'TEST_FUND_001',
      path: '/student/wallet',
    });

    return {
      message: 'Onboarding test completed successfully',
      mentorWallet: {
        accountNo: mentorWallet.accountNo,
        customerName: mentorWallet.customerName,
        balance: await this.walletService.getWalletBalance(
          mentorWallet.accountNo,
        ),
      },
      menteeWallet: {
        accountNo: menteeWallet.accountNo,
        customerName: menteeWallet.customerName,
        balance: await this.walletService.getWalletBalance(
          menteeWallet.accountNo,
        ),
      },
    };
  }
} 