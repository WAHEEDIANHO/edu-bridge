import { HttpStatus, Injectable } from '@nestjs/common';
import { SendMessageDto } from './dto/send-message.dto';
import { RecentChatDto } from './dto/recent-chat.dto';
import { GeneralService } from '../utils/abstract/service/general.service';
import { Message } from './entities/message.entity';
import { IGeneralService } from '../utils/abstract/service/i-general.service';
import { IMessageService } from './abstraction/service/i-message.service';
import { User } from '../user/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from '../user/user.service';
import { PaginationQueryDto } from '../utils/dto/pagination-query.dto';

@Injectable()
export class MessagesService
  extends GeneralService<Message>
  implements IMessageService
{
  constructor(
    @InjectRepository(Message) private readonly repo: Repository<Message>,
    private readonly userService: UserService,
  ) {
    super(repo);
  }

  getUserMessage(receiverId: string): Promise<Message[]> {
    throw new Error('Method not implemented.');
  }
  getUserRecentChats(): Promise<RecentChatDto[]> {
    throw new Error('Method not implemented.');
  }

  async markAsRead(convId: string, sub: string): Promise<void>
  {

    const { data: unreadMessage }: any = await super.findAll({
      conversationId: convId,
      receiverId: sub,
      isRead: false
    } as PaginationQueryDto<any>)

    for (const msg of unreadMessage)
    {
      msg.isRead = true;
      await super.update(msg);
    }
  }
}
