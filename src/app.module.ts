import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppDataSource } from './app.data-source';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UtilsModule } from './utils/utils.module';
import { AuthModule } from './auth/auth.module';
import { CacheInterceptor, CacheModule } from '@nestjs/cache-manager';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { EmailServiceModule } from './email-service/email-service.module';
import { MenteeModule } from './mentee/mentee.module';
import { MentorModule } from './mentor/mentor.module';
import { PaymentModule } from './payment/payment.module';
import { AdminModule } from './admin/admin.module';
import { ConferenceModule } from './conference/conference.module';
import { PerformanceModule } from './performance/performance.module';
import { UserModule } from './user/user.module';
import { BookingModule } from './booking/booking.module';
import { AvailabilitySlotModule } from './availability-slot/availability-slot.module';
import { RatingModule } from './rating/rating.module';
import { SessionModule } from './session/session.module';
import { ActivityModule } from './activity/activity.module';
import { CqrsModule } from '@nestjs/cqrs';
import { DataSource } from 'typeorm';
import { BookingSubscriber } from './booking/subscribers/booking.subscriber';

@Module({
  imports: [
    WinstonModule.forRoot({
      transports: [
        new winston.transports.Console({format: winston.format.simple()}),
        new winston.transports.File({
          filename: 'error.log',
          level: 'error'
        }),
        new winston.transports.File({filename: 'combined.log'})
      ]
    }),
    ConfigModule.forRoot({isGlobal: true}),
    TypeOrmModule.forRootAsync({
      imports: [
        ConfigModule,
        CacheModule.register({
          ttl: 5000, // seconds
        })
      ],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME', 'user'),
        password: configService.get<string>('DB_PASSWORD', 'password'),
        database: configService.get<string>('DB_NAME', 'edu-bridge'),
        synchronize: true,
        logging: false,
        // migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        subscribers: [__dirname + '/**/*.subscriber{.ts,.js}'],
        extra: {
          trustServerCertificate: true, // Required for self-signed certs
        },
        ssl: {
          rejectUnauthorized: false
        }
      })
    }),
    AuthModule,
    UtilsModule,
    ThrottlerModule.forRoot({
      throttlers: [{
        ttl: 60000, // 1 minute
        limit: 5
      }]
    }),
    EmailServiceModule,
    MenteeModule,
    MentorModule,
    PaymentModule,
    AdminModule,
    ConferenceModule,
    PerformanceModule,
    UserModule,
    BookingModule,
    AvailabilitySlotModule,
    RatingModule,
    SessionModule,
    ActivityModule,
    CqrsModule.forRoot()
  ],
  controllers: [],
  providers: [{provide: APP_GUARD, useClass: ThrottlerGuard}, BookingSubscriber],
})
export class AppModule {

  constructor(
    private dataSource: DataSource,
    private bookingSubscriber:  BookingSubscriber,
  )
  {
    this.dataSource.subscribers.push(this.bookingSubscriber);
  }

}
