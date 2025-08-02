import { Module } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { UserModule } from '../user/user.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Message } from './entities/message.entity';
import { JwtModule } from '@nestjs/jwt';
import { UtilsModule } from '../utils/utils.module';

@Module({
  imports: [UserModule, TypeOrmModule.forFeature([Message]), JwtModule, UtilsModule],
  controllers: [MessagesController],
  providers: [MessagesService],
})
export class MessagesModule {}
