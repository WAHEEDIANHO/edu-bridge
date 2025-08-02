// conference.service.ts
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import * as crypto from 'crypto';

@Injectable()
export class ConferenceService {
  private readonly baseUrl = 'https://api.zoom.us/v2';
  // private readonly sdkKey;
  // private readonly sdkSecret;
  private readonly clientId;
  private readonly clientSecret;
  private readonly accountId;
  private readonly hostEmail;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    // this.sdkKey = this.configService.get<string>('ZOOM_SDK_KEY');
    // this.sdkSecret = this.configService.get<string>('ZOOM_SDK_SECRET');
    this.clientId = this.configService.get<string>('ZOOM_CLIENT_ID');
    this.clientSecret = this.configService.get<string>('ZOOM_CLIENT_SECRET');
    this.accountId = this.configService.get<string>('ZOOM_ACCOUNT_ID');
    this.hostEmail = this.configService.get<string>('ZOOM_HOST_EMAIL');
  }

  private async getAccessToken(): Promise<string> {
    const token = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');
    const res = await firstValueFrom(this.httpService.post(
      `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${this.accountId}`,
      {},
      { headers: { Authorization: `Basic ${token}` } }
    ));
    return res.data.access_token;
  }

  async createMeeting(topic: string) {
    const accessToken = await this.getAccessToken();
    const response = await firstValueFrom(this.httpService.post(
      `${this.baseUrl}/users/${this.hostEmail}/meetings`,
      {
        topic,
        type: 1,
        settings: {
          join_before_host: true,
          approval_type: 0,
          waiting_room: false,
        },
      },
      { headers: { Authorization: `Bearer ${accessToken}` } }
    ));

    return response.data;
  }

  generateSdkSignature(meetingNumber: string, role: number): string {
    const iat = Math.floor(Date.now() / 1000) - 30;
    const exp = iat + 60 * 60 * 2;

    const payload = {
      sdkKey: this.clientId,
      appKey: this.clientId,
      mn: meetingNumber,
      role,
      iat,
      exp,
      tokenExp: exp
    };

    const base64UrlEncode = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64url');
    const header = base64UrlEncode({ alg: 'HS256', typ: 'JWT' });
    const payloadEncoded = base64UrlEncode(payload);

    const signature = crypto
      .createHmac('sha256', this.clientSecret)
      .update(`${header}.${payloadEncoded}`)
      .digest('base64url');

    return `${header}.${payloadEncoded}.${signature}`;
  }
}
