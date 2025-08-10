import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  Res,
  Req,
  Query,
} from '@nestjs/common';
import { MessagesService } from './messages.service';
import { SendMessageDto } from './dto/send-message.dto';
import { RecentChatDto } from './dto/recent-chat.dto';
import { Request, Response } from 'express';
import { ApiBearerAuth } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorator/role.decorator';
import { UserRole } from '../user/entities/user.entity';
import { Message } from './entities/message.entity';
import { UserService } from '../user/user.service';
import { PaginationQueryDto } from '../utils/dto/pagination-query.dto';
import { GetUserMessageDto } from './dto/get-user-message.dto';

@Controller('messages')
export class MessagesController {
  constructor(
    private readonly messagesService: MessagesService,
    private readonly userService: UserService,

    ) {}


  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post("send")
  async send(@Req() req: Request,  @Body() sendMessageDto: SendMessageDto, @Res() res:  Response): Promise<Response>
  {
    const { sub } = req.user as any;
    const sender = await this.userService.findById(sub);
    const receiver = await this.userService.findById(sendMessageDto.receiverId);
    if(!sender || !receiver) return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "sender or receiver not find"));

    const chat = new Message()
    chat.senderId = sender.id;
    chat.conversationId = Message.generateConversationId(sender.id, receiver.id)

    Object.assign(chat, sendMessageDto);
    await this.messagesService.create(chat);

    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "message sent successfully"));

  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('user-message')
  async getUserMessages(@Req() req: Request,  @Query() getUserMessageDto: GetUserMessageDto,  @Res() res:  Response): Promise<Response>
  {
    const { sub } = req.user as any;
    const sender = await this.userService.findById(sub);
    const receiver = await this.userService.findById(getUserMessageDto.receiverId);
    if(!sender || !receiver) return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "sender or receiver not find"));

    const convId = Message.generateConversationId(sender.id, receiver.id);


    const  { data: conversations } = await this.messagesService.findAll({ cursorField: "createdAt", limit: Number.MAX_SAFE_INTEGER, conversationId: convId } as PaginationQueryDto<any>, ['sender', 'receiver', 'replyMessage']);
    console.log(conversations, "this is conversational id")
    await this.messagesService.markAsRead(convId, sub);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "message retrieved successfully", conversations));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('user-recent-chat')
  async getUserRecentChat(@Req() req: Request,  @Res() res:  Response): Promise<Response>
  {
    const { sub } = req.user as any;
    const sender = await this.userService.findById(sub);
    if(!sender) return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "sender or receiver not find"));

    // const convId = Message.generateConversationId(sender.id, receiver.id);

    // const  { data: privateChat } = await this.messagesService.findAll({ or: [`senderId=${sub}`, `receiverId=${sub}`], cursorField: "createdAt", limit: Number.MAX_SAFE_INTEGER } as PaginationQueryDto<any>, ['sender', 'receiver', 'replyMessage']);
    // const grpConversation =
    const { data: allMessages } = await this.messagesService.findAll(
      {
        or: [`senderId=${sub}`, `receiverId=${sub}`],
        cursorField: 'createdAt',
        order: 'DESC',
        limit: Number.MAX_SAFE_INTEGER,
      } as PaginationQueryDto<any>,
      ['sender', 'receiver', 'replyMessage']
    );

    const privateChat = Object.values(
      allMessages.reduce((acc, msg) => {
        const convId = msg.conversationId;
        if (!acc[convId] || new Date(msg.createdAt!) > new Date(acc[convId].createdAt!)) {
          acc[convId] = msg;
        }
        return acc;
      }, {} as Record<string, typeof allMessages[0]>)
    ).sort((a, b) => new Date(b.createdAt!).getTime() - new Date(a.createdAt!).getTime());

    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "message retrieved successfully", privateChat));
  }


}






