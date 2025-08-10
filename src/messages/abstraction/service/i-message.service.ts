import { IGeneralService } from '../../../utils/abstract/service/i-general.service';
import { Message } from '../../entities/message.entity';
import { SendMessageDto } from '../../dto/send-message.dto';
import { RecentChatDto } from '../../dto/recent-chat.dto';
import { User } from '../../../user/entities/user.entity';


export interface IMessageService extends IGeneralService<Message>
{
  getUserMessage(receiverId: string): Promise<Message[]>;
  getUserRecentChats(): Promise<RecentChatDto[]>;
}