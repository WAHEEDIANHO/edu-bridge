// conference.controller.ts
import { Controller, Post, Body, Query, Get } from '@nestjs/common';
import { ConferenceService } from './conference.service';

@Controller('conference')
export class ConferenceController {
  constructor(private readonly service: ConferenceService) {}

  @Post('create')
  async createMeeting(@Body('topic') topic: string) {
    const meeting = await this.service.createMeeting(topic || 'EduBridge Meeting');
    const signature = this.service.generateSdkSignature(meeting.id.toString(), 1); // 1 = host
    return {
      sdkKey: process.env.ZOOM_SDK_KEY,
      meetingNumber: meeting.id,
      password: meeting.password,
      signature,
      topic: meeting.topic,
      join_url: meeting.join_url,
    };
  }

  @Get('signature')
  getSignature(@Query('meetingNumber') meetingNumber: string, @Query('role') role: string) {
    return {
      signature: this.service.generateSdkSignature(meetingNumber, parseInt(role)),
    };
  }
}
