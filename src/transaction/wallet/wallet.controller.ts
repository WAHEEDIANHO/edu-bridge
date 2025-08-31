import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  BadRequestException,
  Query,
  UnauthorizedException, Req, Res, HttpStatus,
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
import { Request, Response } from 'express';
import { UserRole } from 'src/user/entities/user.entity';
import { TransactionQueryDto } from './dto/transaction-query-dto';
import { PaymentService } from '../../payment/payment.service';


@Controller('wallet')
export class WalletController {
  constructor(
    private readonly walletService: WalletService,
    private readonly paymentService: PaymentService,
    ) {}

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

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('details/:accountNo')
  async getWalletDetails(@Param('accountNo') accountNo: string, @Res() res: Response): Promise<Response> {
    const wallet = await this.walletService.getWallet(accountNo);
    const balance = await this.walletService.getWalletBalance(accountNo);

    const data = {
      ...wallet,
      currentBalance: balance
    };

    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "account details received successfully", data));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('user/:userId')
  async getUserWallet(@Param('userId') userId: string, @Res() res: Response): Promise<Response> {
    const walletInfo = await this.walletService.getWalletInfoForUser(userId);
    
    if (!walletInfo) {
      return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, `No wallet found for this user ${userId}`,  ))
    }
    
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Wallet found", {
      userId,
      hasWallet: true,
      ...walletInfo
    }));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('transactions/:accountNo')
  async getTransactionHistory(
    @Req() req: any,
    @Param('accountNo') accountNo: string,
    @Query()query: TransactionQueryDto,
    @Res() res: Response
  ): Promise<Response> {
    // Validate pagination parameters
    const pageNum = Math.max(1, parseInt(query.page as any) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(query.limit as any) || 10));
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
        type: query.type,
        status: query.status,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined
      }
    );
    
    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;
    
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Transaction retrieved successfully", {
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
        type: query?.type,
        status: query?.status,
        startDate: query.startDate ? new Date(query.startDate) : undefined,
        endDate: query.endDate ? new Date(query.endDate) : undefined
      }
    }));
  }
  
  
  @Post("webhook/paystack")
  async webhookPayStack(@Req() req: Request, @Body() webhook: object, @Res() res: Response): Promise<Response> {
    
    console.log("name here =========================");
    // validate event
    const haveMessage = await this.walletService.handlePaystackWebhook(req);
    if (haveMessage) {
      return res.status(HttpStatus.BAD_REQUEST).send('Invalid event');
    }
    return res.status(HttpStatus.OK).send('Event received');
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('fund')
  async fundWallet(@Req() req: Request, @Body() fundWalletDto: FundWalletDto, @Res() res: Response): Promise<Response> {
    
    const transaction = await this.walletService.fundWallet(fundWalletDto);
    if (!transaction.payment_gateway.status) {
      return res.status(HttpStatus.UNPROCESSABLE_ENTITY).json(res.formatResponse(HttpStatus.OK, transaction?.payment_gateway.message || 'Unable to process payment', transaction.payment_gateway.data))
    }
    // const newBalance = await this.walletService.getWalletBalance(fundWalletDto.accountNo);

    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK,'success', {
      url: transaction.payment_gateway.data.authorization_url,
      accessCode: transaction.payment_gateway.data.access_code,
      reference: transaction.payment_gateway.data.reference,
    }))
    
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('payment')
  async makePayment(@Body() paymentDto: PaymentDto, @Res() res: Response): Promise<Response> {
    const transaction = await this.walletService.makePayment(paymentDto);
    const fromBalance = await this.walletService.getWalletBalance(paymentDto.fromAccountNo);
    const toBalance = await this.walletService.getWalletBalance(paymentDto.toAccountNo);
    
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "payment processed successful", {
      transaction,
      fromAccountBalance: fromBalance,
      toAccountBalance: toBalance,
      currency: 'NGN'
    }));
  }
  
  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('withdraw/request')
  async requestWithdrawal(@Body() withdrawRequestDto: WithdrawRequestDto, @Res() res: Response): Promise<Response> {
    const resp = await this.walletService.requestWithdrawal(withdrawRequestDto);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "successful", resp))
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Post('withdraw/approve/:transactionId')
  async approveWithdrawal(@Req() req: Request,  @Param('transactionId') transactionId: string, @Res() res: Response) : Promise<Response> {

    const { sub } = req.user as any
    const transaction = await this.walletService.approveWithdrawal(transactionId, sub);
    const newBalance = await this.walletService.getWalletBalance(transaction.customerAccountNo);
    
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Withdrawal approved successfully", {
      transaction,
      newBalance,
      currency: 'NGN'
    }));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Post('withdraw/reject/:transactionId')
  async rejectWithdrawal(
    @Param('transactionId') transactionId: string,
    @Body() body: { reason?: string },
    @Res() res: Response
  ): Promise<Response> {
    const transaction = await this.walletService.rejectWithdrawal(transactionId, ""+body.reason);
    
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Withdrawal rejected", {
      message: 'Withdrawal rejected',
      transaction,
      reason: body.reason || 'Admin rejection'
    }));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Get('withdrawals/pending')
  async getPendingWithdrawals(@Res() res: Response): Promise<Response> {
    const withdrawals = await this.walletService.getPendingWithdrawals();
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "", {
      pendingWithdrawals: withdrawals,
      totalPending: withdrawals.length
    }));
  }

} 