import { IsString, IsNotEmpty, IsNumber, IsPositive, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PaymentDto {
  @ApiProperty({
    description: 'Source wallet account number',
    example: 'WAL123456789'
  })
  @IsString()
  @IsNotEmpty()
  fromAccountNo: string;

  @ApiProperty({
    description: 'Destination wallet account number',
    example: 'WAL987654321'
  })
  @IsString()
  @IsNotEmpty()
  toAccountNo: string;

  @ApiProperty({
    description: 'Payment amount',
    example: 2500
  })
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiProperty({
    description: 'Session ID associated with the payment',
    example: 'session123',
    required: false
  })
  @IsString()
  @IsOptional()
  sessionId?: string;

  @ApiProperty({
    description: 'Payment description',
    example: 'Math tutoring session payment',
    required: false
  })
  @IsString()
  @IsOptional()
  description?: string;
} 