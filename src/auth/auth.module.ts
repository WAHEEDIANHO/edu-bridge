import { Module, forwardRef } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UserService } from '../user/user.service';
import { JwtModule } from '@nestjs/jwt';
import { HashPassword } from '../utils/hash-password';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../user/entities/user.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from '../utils/google.strategy';
import { EmailServiceModule } from '../email-service/email-service.module';
import { EmailServiceService } from '../email-service/email-service.service';
import { ExtractToken } from '../utils/extract-token';
import { UserModule } from '../user/user.module';
import { Otp } from './entities/otp.entity';
import { WalletModule } from '../transaction/wallet/wallet.module';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get('SECRET_KEY'),
      }),
    }),
    ConfigModule,
    PassportModule,
    EmailServiceModule,
    UserModule,
    TypeOrmModule.forFeature([User, Otp]),
    // CacheModule.register({
    //   ttl: 30000, // seconds
    // })
    forwardRef(() => WalletModule)
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService,  HashPassword, GoogleStrategy, EmailServiceService, ExtractToken],
  exports: [],
})
export class AuthModule {}
