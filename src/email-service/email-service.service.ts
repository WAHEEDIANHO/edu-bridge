import { Injectable } from '@nestjs/common';
import { IVerificationMailTemplateParamType } from './types/i-verification-mail-template-param.type';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';




@Injectable()
export class EmailServiceService {

  private readonly API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

  constructor(private readonly configService: ConfigService) { }


  async sendVerificationMail(templateParams: IVerificationMailTemplateParamType): Promise<void> {

    const emailData = {
      service_id: this.configService.get<string>('EMAIL_SERVICE_ID'),
      template_id: this.configService.get<string>('VERIFICATION_EMAIL_TEMPLATE_ID'),
      user_id: this.configService.get<string>('EMAIL_SMTP_PUBLIC_KEY'),
      template_params: {
        email: templateParams.email,
        verification_url: templateParams.verificationUrl,
        name: templateParams.name,
        // 'g-recaptcha-response': '03AHJ_ASjnLA214KSNKFJAK12sfKASfehbmfd...'
      }
    }


    try {
       await axios.post(this.API_URL, emailData, {
        headers: {
          'Content-Type': 'application/json',
          'Origin': "http://localhost:3000",// this.configService.get<string>('EMAIL_SERVICE_ORIGIN'),
          'User-Agent': 'EmailJS/1.0'
        }
       });

    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }
}
