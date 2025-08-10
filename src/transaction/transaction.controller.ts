import { Controller, Get, Post, Body, Patch, Param, Delete, Query } from '@nestjs/common';
import { TransactionService } from './transaction.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { WalletTransaction } from './entities/transaction.entity';
import { PaginationQueryDto } from 'src/utils/dto/pagination-query.dto';

@Controller('transaction')
export class TransactionController {
  constructor(private readonly transactionService: TransactionService) {}

  @Post()
  async create(@Body() createTransactionDto: CreateTransactionDto) {
    const transaction = new WalletTransaction();
    Object.assign(transaction, createTransactionDto);
    return await this.transactionService.create(transaction);
  }

  @Get()
  async findAll(@Query() paginationQueryDto: PaginationQueryDto<WalletTransaction>) {
    return await this.transactionService.findAll(paginationQueryDto);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.transactionService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTransactionDto: UpdateTransactionDto) {
    const transaction = await this.transactionService.findById(id);
    if (!transaction) {
      throw new Error('Transaction not found');
    }
    Object.assign(transaction, updateTransactionDto);
    return await this.transactionService.update(transaction);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.transactionService.delete(id);
  }

  // Transaction-specific endpoints
  @Get('account/:accountNo/history')
  async getTransactionHistory(@Param('accountNo') accountNo: string) {
    return await this.transactionService.getTransactionHistory(accountNo);
  }

  @Get('account/:accountNo/summary')
  async getAccountSummary(@Param('accountNo') accountNo: string) {
    return await this.transactionService.getAccountSummary(accountNo);
  }

  @Get('account/:accountNo/balance')
  async getWalletBalance(@Param('accountNo') accountNo: string) {
    return await this.transactionService.synchronizeWalletBalance(accountNo);
  }
}
