import { Module } from '@nestjs/common';
import { MentorService } from './mentor.service';
import { MentorController } from './mentor.controller';
import { AuthModule } from '../auth/auth.module';
import { UserService } from '../auth/user.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../auth/entities/user.entity';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { HashPassword } from '../utils/hash-password';
import { Mentor } from './entities/mentor.entity';
import { Rate } from './entities/rate.entity';
import { EmailServiceService } from '../email-service/email-service.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ExtractToken } from '../utils/extract-token';

@Module({
  imports: [TypeOrmModule.forFeature([User, Mentor, Rate]), AuthModule, JwtModule.registerAsync({
    imports: [ConfigModule],
    inject: [ConfigService],
    useFactory: async (configService: ConfigService) => ({
      secret: configService.get('SECRET_KEY'),
    }),
  }),ConfigModule],
  controllers: [MentorController],
  providers: [MentorService, UserService, HashPassword, EmailServiceService, ConfigService, ExtractToken],
})
export class MentorModule {}
