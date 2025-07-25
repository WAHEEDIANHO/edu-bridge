import { Injectable } from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { IMeetingCreationResult } from './abstract/type/i-meeting-result';

@ApiExcludeController()
@Injectable()
export class ConferenceService {
  private readonly baseUrl = 'https://api.zoom.us/v2';
  private readonly zoomAccountId ;
  private readonly zoomClientId ;
  private readonly zoomClientSecret ;
  private readonly hostEmail;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  )
  {
    this.zoomAccountId = this.configService.get<string>('ZOOM_ACCOUNT_ID');
    this.zoomClientId = this.configService.get<string>('ZOOM_CLIENT_ID');
    this.zoomClientSecret = this.configService.get<string>('ZOOM_CLIENT_SECRET');
    this.hostEmail = this.configService.get<string>('ZOOM_HOST_EMAIL'); // 🟢 Host email
  }

  private async getAccessToken(): Promise<string> {
    const token = Buffer.from(`${this.zoomClientId}:${this.zoomClientSecret}`).toString('base64');
    const response = await firstValueFrom(
      this.httpService.post(
        `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${this.zoomAccountId}`,
        {},
        {
          headers: {
            Authorization: `Basic ${token}`,
          },
        },
      )
    );

    console.log(response.data);
    return response.data.access_token;
  }




  async createMeeting(topic: string): Promise<IMeetingCreationResult> {
    const accessToken = await this.getAccessToken();
    const res = await firstValueFrom(this.httpService.post(
      `${this.baseUrl}/users/${this.hostEmail}/meetings`,
      {
        topic,
        type: 1, // Instant meeting 2 for scheduled meeting
        // schedule_for: hostEmail, // 🟢 Host email
        // pre_schedule: true, // 🟢 Host email
        settings: {
          join_before_host: true,
          approval_type: 0,
          waiting_room: false,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    ));
    console.log(res.data);
    return res.data; // Return the meeting link
  }


  getMeetingSDKJWT(): string {
    const header = {
      alg: 'HS256',
      typ: 'JWT',
    };

    const timestamp = Math.floor(Date.now() / 1000);

    const payload = {
      sdkKey: "f3uSTv8T7yHiRrYu3p9ZQ",
      appKey: "f3uSTv8T7yHiRrYu3p9ZQ",
      mn: "82835432650", // 🟢 As string
      role: 0, // 0 for host, 1 for attendee
      iat: timestamp - 30,              // 🟢 Add buffer
      exp: timestamp + 2 * 60 * 60,     // 2 hours
      tokenExp: timestamp + 2 * 60 * 60
    };

    const base64UrlEncode = (obj: any) => {
      return Buffer.from(JSON.stringify(obj)).toString('base64url');
    };

    const encodedHeader = base64UrlEncode(header);
    const encodedPayload = base64UrlEncode(payload);

    const signature = require('crypto')
      .createHmac('sha256', this.zoomClientSecret)
      .update(`${encodedHeader}.${encodedPayload}`)
      .digest('base64url');

    return `${encodedHeader}.${encodedPayload}.${signature}`;
  }


}
