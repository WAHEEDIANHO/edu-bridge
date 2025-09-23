import { Controller, Get, Post, Body, Patch, Param, Delete, Req, Res, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { AuthGuard } from '../auth/guard/auth.guard';
import { ApiBearerAuth } from '@nestjs/swagger';
import { SaveCardDto } from './dto/save-card.dto';

// @ApiExcludeController()
@Controller('payment')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}


  @Get("banks")
  async getBanks(@Req() req: Request, @Res() res: Response): Promise<Response> {

    const banks = await this.paymentService.getBanks();
    return res.status(200).json(res.formatResponse(HttpStatus.OK, "Banks fetched successfully", banks));
  }

  @Get("verify-account")
  async verifyAccount(
    @Req() req: Request,
    @Query('accountNumber') accountNumber: string,
    @Query('bankCode') bankCode: string,
    @Res() res: Response): Promise<Response> {
    if (!accountNumber || !bankCode) {
      return res.status(400).json(res.formatResponse(HttpStatus.BAD_REQUEST, "accountNumber and bankCode are required"));
    }
    const { message, data } = await this.paymentService.verifyAccount(accountNumber as string, bankCode as string);
    return res.status(200).json(res.formatResponse(HttpStatus.OK, message, data));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('card/save-method')
  async saveCard(@Req() req: Request, @Body() dto: SaveCardDto, @Res() res: Response): Promise<Response> {
    const user: any = req.user;
    const reference = `CARDINIT-${Date.now()}`;
    const metadata = JSON.stringify({ type: 'card_save', userId: user.sub });
    const init = await this.paymentService.initializeTransaction(dto.email, 50, reference, dto.callbackPath || '/payment/callback', metadata);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, 'Initialize card save', init?.data));
  }
}
