import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class FundWalletDto {
  @ApiProperty({
    description: 'Wallet account number to fund',
    example: 'WAL123456789'
  })
  @IsString()
  @IsNotEmpty()
  accountNo: string;

  @ApiProperty({
    description: 'Amount to fund the wallet',
    example: 5000
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Payment method used for funding',
    example: 'card',
    required: false
  })
  @IsString()
  @IsOptional()
  paymentMethod?: string;

  @ApiProperty({
    description: 'Payment reference number',
    example: 'PAY123456789',
    required: false
  })
  @IsString()
  @IsOptional()
  reference?: string;
} 