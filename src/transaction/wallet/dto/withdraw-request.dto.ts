import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BankDetailsDto {
  @ApiProperty({
    description: 'Account holder name',
    example: 'John Doe'
  })
  @IsString()
  @IsNotEmpty()
  accountName: string;

  @ApiProperty({
    description: 'Bank account number',
    example: '1234567890'
  })
  @IsString()
  @IsNotEmpty()
  accountNumber: string;

  @ApiProperty({
    description: 'Bank name',
    example: 'First Bank of Nigeria'
  })
  @IsString()
  @IsNotEmpty()
  bankName: string;
}

export class WithdrawRequestDto {
  @ApiProperty({
    description: 'Wallet account number',
    example: 'WAL123456789'
  })
  @IsString()
  @IsNotEmpty()
  accountNo: string;

  @ApiProperty({
    description: 'Withdrawal amount',
    example: 10000
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Bank details for withdrawal',
    type: BankDetailsDto,
    required: false
  })
  @IsOptional()
  @ValidateNested()
  @Type(() => BankDetailsDto)
  bankDetails?: BankDetailsDto;

  @ApiProperty({
    description: 'Reason for withdrawal',
    example: 'Need funds for personal use',
    required: false
  })
  @IsString()
  @IsOptional()
  reason?: string;
} 