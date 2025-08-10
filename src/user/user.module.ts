import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { HashPassword } from '../utils/hash-password';
import { JwtModule } from '@nestjs/jwt';
import { EmailServiceModule } from '../email-service/email-service.module';
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
    EmailServiceModule,
    ConfigModule
  ],
  controllers: [UserController],
  providers: [UserService, HashPassword, ExtractToken],
  exports: [UserService],
})
export class UserModule {}
