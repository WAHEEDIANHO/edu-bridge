import { ApiProperty } from '@nestjs/swagger';
import { SendMessageDto } from './send-message.dto';
import { IsEnum, IsNumber, IsString } from 'class-validator';
import { User } from '../../user/entities/user.entity';

export enum ConversationType {
  Direct,
  Group
}

export class RecentChatDto
{
  @ApiProperty({ description: 'Conversation or group ID', type: 'string' })
  id: string;

  @ApiProperty({ enum: ConversationType })
  @IsEnum(ConversationType)
  type: ConversationType;

  @ApiProperty()
  @IsString()
  lastMessage: string;

  @ApiProperty({ type: String, format: 'date-time' })
  timestamp: Date;

  @ApiProperty()
  @IsNumber()
  noOfUnreadMessages: number;

  @ApiProperty()
  profile: User;

}
