import { IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';


export class GetUserMessageDto {

  @ApiProperty()
  @IsUUID()
  receiverId: string;
}