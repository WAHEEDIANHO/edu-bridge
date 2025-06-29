import { Module } from '@nestjs/common';
import { MenteeService } from './mentee.service';
import { MenteeController } from './mentee.controller';
import { AuthModule } from '../auth/auth.module';
import { UserService } from '../auth/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { HashPassword } from '../utils/hash-password';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Mentee } from './entities/mentee.entity';
import { EmailServiceService } from '../email-service/email-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExtractToken } from '../utils/extract-token';

@Module({
  imports: [TypeOrmModule.forFeature([User, Mentee]), AuthModule, JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      secret: configService.get('SECRET_KEY'),
    }),
  }),ConfigModule],
  controllers: [MenteeController],
  providers: [MenteeService, UserService, HashPassword, EmailServiceService, ExtractToken],
})
export class MenteeModule {}
