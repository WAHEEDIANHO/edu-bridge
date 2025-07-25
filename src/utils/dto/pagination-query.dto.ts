import { IsEnum, IsNumber, IsNumberString, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';
import { IEntity } from '../abstract/database/i-enity';

export enum SortOrder {
  ASC = 'ASC',
  DESC = 'DESC',
}

export class PaginationQueryDto<T extends IEntity> {
  @ApiProperty({ required: false })
  @IsNumber()
  @Type(() => Number)
  limit?: number = 10;

  @ApiProperty({ required: false })
  @IsString()
  cursor?: string;

  @ApiProperty({ required: false })
  @IsEnum(SortOrder)
  order?: SortOrder = SortOrder.DESC;

  @ApiProperty({ required: false, type: "string" })
  @IsString()
  cursorField?: keyof T = 'id' as keyof T;  // default pagination field
}