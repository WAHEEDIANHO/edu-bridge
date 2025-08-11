import { PaginationQueryDto } from '../../../utils/dto/pagination-query.dto';
import { WalletTransaction } from '../../entities/transaction.entity';
import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNumber, IsString } from 'class-validator';
import { Query } from '@nestjs/common';

export class TransactionQueryDto extends PaginationQueryDto<WalletTransaction>
{
    @ApiProperty({ required: false })
    @IsString()
    type?: string;
    @ApiProperty({ required: false })
    @IsString()
    status?: string;
    @ApiProperty({ required: false })
    @IsDateString()
    startDate?: string;
    @ApiProperty({ required: false })
    @IsDateString()
    endDate?: string;

    @ApiProperty({ required: false })
    @IsNumber()
    page: number = 1;

}