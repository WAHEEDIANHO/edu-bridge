import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { JwtModule } from '@nestjs/jwt';
import { HashPassword } from '../utils/hash-password';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from '../utils/google.strategy';
import { EmailServiceModule } from '../email-service/email-service.module';
import { EmailServiceService } from '../email-service/email-service.service';
import { ExtractToken } from '../utils/extract-token';

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
    ConfigModule,
    PassportModule,
    EmailServiceModule
    // CacheModule.register({
    //   ttl: 30000, // seconds
    // })
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService, HashPassword, GoogleStrategy, EmailServiceService, ExtractToken],
  exports: [],
})
export class AuthModule {}
