import { Module } from '@nestjs/common';
import { EmailServiceService } from './email-service.service';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule],
  controllers: [],
  providers: [EmailServiceService],
  exports: [EmailServiceService]
})
export class EmailServiceModule {}
