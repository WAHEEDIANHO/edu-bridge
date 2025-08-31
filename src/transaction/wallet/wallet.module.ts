import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WalletService } from './wallet.service';
import { WalletController } from './wallet.controller';
import { Wallet } from './entities/wallet.entity';
import { WalletTransaction } from '../entities/transaction.entity';
import { TransactionModule } from '../transaction.module';
import { JwtModule } from '@nestjs/jwt';
import { UtilsModule } from '../../utils/utils.module';
import { PaymentModule } from '../../payment/payment.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, WalletTransaction]),
    TransactionModule,
    JwtModule, 
    UtilsModule,
    PaymentModule
  ],
  controllers: [WalletController],
  providers: [WalletService],
  exports: [WalletService]
})
export class WalletModule {} 