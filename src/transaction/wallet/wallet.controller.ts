import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  Query,
  UnauthorizedException, Req,
} from '@nestjs/common';
import { WalletService } from './wallet.service';
// import { CreateWalletDto } from './dto/create-wallet.dto';
import { FundWalletDto } from './dto/fund-wallet.dto';
import { PaymentDto } from './dto/payment.dto';
import { WithdrawRequestDto } from './dto/withdraw-request.dto';
import { AuthGuard } from '../../auth/guard/auth.guard';
import { RoleGuard } from '../../auth/guard/role.guard';
import { Roles } from '../../auth/decorator/role.decorator';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { UserRole } from 'src/user/entities/user.entity';

@ApiBearerAuth()
@UseGuards(AuthGuard)
@Controller('wallet')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

//   @Post('create')
//   async createWallet(@Body() createWalletDto: CreateWalletDto) {
//     return await this.walletService.createWallet(createWalletDto);
//   }

//   @Get('balance/:accountNo')
//   async getWalletBalance(@Param('accountNo') accountNo: string) {
//     const balance = await this.walletService.getWalletBalance(accountNo);
//     return {
//       accountNo,
//       balance,
//       currency: 'NGN' // Nigerian Naira for demo
//     };
//   }

  @Get('details/:accountNo')
  async getWalletDetails(@Param('accountNo') accountNo: string): Promise<any> {
    const wallet = await this.walletService.getWallet(accountNo);
    const balance = await this.walletService.getWalletBalance(accountNo);

    return {
      ...wallet,
      currentBalance: balance
    };
  }

  @Get('user/:userId')
  async getUserWallet(@Param('userId') userId: string) {
    const walletInfo = await this.walletService.getWalletInfoForUser(userId);
    
    if (!walletInfo) {
      return {
        message: 'No wallet found for this user',
        userId,
        hasWallet: false
      };
    }
    
    return {
      message: 'Wallet found',
      userId,
      hasWallet: true,
      ...walletInfo
    };
  }

  @Get('transactions/:accountNo')
  async getTransactionHistory(
    @Req() req: any,
    @Param('accountNo') accountNo: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('type') type?: string,
    @Query('status') status?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(page as any) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit as any) || 10));
    const offset = (pageNum - 1) * limitNum;
    
    // Security check: Verify user has access to this wallet
    const userId = req.user?.sub;
    if (userId) {
      const wallet = await this.walletService.getWalletByUserId(userId);
      const isAdmin = req.user?.role === UserRole.ADMIN;
      
      if (!isAdmin && (!wallet || wallet.accountNo !== accountNo)) {
        throw new UnauthorizedException('You are not authorized to view transactions for this wallet');
      }
    }
    
    // Get transactions with pagination and filtering
    const { transactions, total } = await this.walletService.getTransactionHistory(
      accountNo,
      limitNum,
      offset,
      {
        type,
        status,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined
      }
    );
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;
    
    return {
      accountNo,
      transactions,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages,
        hasNextPage,
        hasPrevPage
      },
      filters: {
        type,
        status,
        startDate,
        endDate
      }
    };
  }

  @Post('fund')
  async fundWallet(@Body() fundWalletDto: FundWalletDto) {
    const transaction = await this.walletService.fundWallet(fundWalletDto);
    const newBalance = await this.walletService.getWalletBalance(fundWalletDto.accountNo);
    
    return {
      message: 'Wallet funded successfully',
      transaction,
      newBalance,
      currency: 'NGN'
    };
  }

  @Post('payment')
  async makePayment(@Body() paymentDto: PaymentDto) {
    const transaction = await this.walletService.makePayment(paymentDto);
    const fromBalance = await this.walletService.getWalletBalance(paymentDto.fromAccountNo);
    const toBalance = await this.walletService.getWalletBalance(paymentDto.toAccountNo);
    
    return {
      message: 'Payment processed successfully',
      transaction,
      fromAccountBalance: fromBalance,
      toAccountBalance: toBalance,
      currency: 'NGN'
    };
  }

  @Post('withdraw/request')
  async requestWithdrawal(@Body() withdrawRequestDto: WithdrawRequestDto) {
    return await this.walletService.requestWithdrawal(withdrawRequestDto);
  }

  @Post('withdraw/approve/:transactionId')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  async approveWithdrawal(@Req() req: Request,  @Param('transactionId') transactionId: string) {

    const { sub } = req.user as any
    const transaction = await this.walletService.approveWithdrawal(transactionId, sub);
    const newBalance = await this.walletService.getWalletBalance(transaction.customerAccountNo);
    
    return {
      message: 'Withdrawal approved successfully',
      transaction,
      newBalance,
      currency: 'NGN'
    };
  }

  @Post('withdraw/reject/:transactionId')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  async rejectWithdrawal(
    @Param('transactionId') transactionId: string,
    @Body() body: { reason?: string }
  ) {
    const transaction = await this.walletService.rejectWithdrawal(transactionId, ""+body.reason);
    
    return {
      message: 'Withdrawal rejected',
      transaction,
      reason: body.reason || 'Admin rejection'
    };
  }

  @Get('withdrawals/pending')
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  async getPendingWithdrawals() {
    const withdrawals = await this.walletService.getPendingWithdrawals();
    return {
      pendingWithdrawals: withdrawals,
      totalPending: withdrawals.length
    };
  }

} 