import { IsOptional, IsString, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SendMessageDto
{

  @ApiProperty()
  @IsUUID()
  receiverId: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  text: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsUUID()
  replyMessageId?: string

  @ApiProperty({ required: false })
  @IsString()
  fileUrl?: string
}
