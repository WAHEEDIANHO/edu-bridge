import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { HashPassword } from '../utils/hash-password';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { EmailServiceService } from '../email-service/email-service.service';
import { ExtractToken } from '../utils/extract-token';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('SECRET_KEY'),
      }),
    }),
    TypeOrmModule.forFeature([User]),

  ],
  controllers: [UserController],
  providers: [UserService, HashPassword, JwtService, EmailServiceService, ExtractToken, ConfigService ],
})
export class UserModule {}
