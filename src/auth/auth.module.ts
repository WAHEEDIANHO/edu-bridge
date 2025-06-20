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
    // CacheModule.register({
    //   ttl: 30000, // seconds
    // })
  ],
  controllers: [AuthController],
  providers: [AuthService, UserService, HashPassword],
  exports: [],
})
export class AuthModule {}
