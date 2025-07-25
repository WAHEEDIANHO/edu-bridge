import { Module } from '@nestjs/common';
import { ConferenceService } from './conference.service';
import { ConferenceController } from './conference.controller';
import { HttpModule } from '@nestjs/axios';

@Module({
  imports: [HttpModule],
  controllers: [ConferenceController],
  providers: [ConferenceService],
  exports: [ConferenceService]
})
export class ConferenceModule {}
