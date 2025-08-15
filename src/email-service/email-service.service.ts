import { Injectable } from '@nestjs/common';
import {
  IEmailParamsBase,
  IEmailParamsWithAction,
  IOtpMailTemplateParamType, ISessionCompleteNotification,
  IVerificationMailTemplateParamType,
} from './types/i-verification-mail-template-param.type';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';




@Injectable()
export class EmailServiceService {

  private readonly API_URL = 'https://api.emailjs.com/api/v1.0/email/send';

  constructor(private readonly configService: ConfigService) { }


  async sendVerificationMail(templateParams: IVerificationMailTemplateParamType): Promise<void> {

    const emailData:{
      service_id?: string,
      template_id?: string,
      user_id?: string,
      template_params: IEmailParamsWithAction
    } = {
      service_id: this.configService.get<string>('EMAIL_SERVICE_ID'),
      template_id: this.configService.get<string>('ACTION_EMAIL_TEMPLATE_ID'),
      user_id: this.configService.get<string>('EMAIL_SMTP_PUBLIC_KEY'),
      template_params: {
        email: templateParams.email,
        action_url: templateParams.verificationUrl,
        recipient_name: templateParams.name,
        action_text: "Verify",
        company_email: "info@edubridge.com",
        main_message: "We’re excited to have you join Edu-Bridge!  \n" +
          "Before you can start exploring all the features we offer, please confirm your email address by clicking the button below.",
        additional_info: "This verification link will expire in 24 hours.  \n" +
          "If you did not sign up for an account, you can safely ignore this email.",
        app_url: "https://edubridge-drab.vercel.app/",
        company_name: "Edu-Bridge",
        subject_prefix: "Welcome to "
        // 'g-recaptcha-response': '03AHJ_ASjnLA214KSNKFJAK12sfKASfehbmfd...'
      }
    }


    try {
       await axios.post(this.API_URL, emailData, {
         headers: {
           'Content-Type': 'application/json',
           Origin: `${this.configService.get("BACKEND_BASE_URL")}`, // this.configService.get<string>('EMAIL_SERVICE_ORIGIN'),
           'User-Agent': 'EmailJS/1.0',
         },
       });

    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }
  }

  async sendOtpMail(templateParams: IOtpMailTemplateParamType): Promise<void> {
    const emailData: {
      service_id?: string,
      template_id?: string,
      user_id?: string,
      template_params: IEmailParamsBase
    } = {
      service_id: this.configService.get<string>('EMAIL_SERVICE_ID'),
      template_id: this.configService.get<string>('NOACTION_EMAIL_TEMPLATE_ID'), // change this to your OTP template ID
      user_id: this.configService.get<string>('EMAIL_SMTP_PUBLIC_KEY'),
      template_params: {
        email: templateParams.email,
        recipient_name: "",
        company_email: "info@edubridge.com",
        main_message: `
          Your One-Time Password (OTP) for Edu bridge is: ${templateParams.otp}  
          Please use this code to complete your verification process.
        `,
        additional_info: `This OTP will expire in 5 minutes.  
          If you did not request this code, please ignore this email or contact our support team..`,
        app_url: "https://edubridge-drab.vercel.app/",
        company_name: "Edu-Bridge",
        subject_prefix: "Welcome to "
      }
    }

    console.log('Sending Otp Mail Template:', emailData);

    try {
      await axios.post(this.API_URL, emailData, {
        headers: {
          'Content-Type': 'application/json',
          Origin: `${this.configService.get("BACKEND_BASE_URL")}`, // this.configService.get<string>('EMAIL_SERVICE_ORIGIN'),
          'User-Agent': 'EmailJS/1.0',
        },
      });

    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }

  }

  async sendSessionCompleteNotification(templateParams: ISessionCompleteNotification): Promise<void> {
    const emailData: {
      service_id?: string,
      template_id?: string,
      user_id?: string,
      template_params: IEmailParamsWithAction
    } = {
      service_id: this.configService.get<string>('EMAIL_SERVICE_ID'),
      template_id: this.configService.get<string>('ACTION_EMAIL_TEMPLATE_ID'), // change this to your OTP template ID
      user_id: this.configService.get<string>('EMAIL_SMTP_PUBLIC_KEY'),
      template_params: {
        email: templateParams.email,
        recipient_name: templateParams.name,
        company_email: "info@edubridge.com",
        main_message: `
         Your session with ${templateParams.tutorName} has been successfully completed.  
          We hope you found it valuable and engaging.  
          Please take a moment to share your feedback — it helps us improve and also assists other students in making informed choices
        `,
        additional_info: `
          Click the button below to submit your review.  
          Your feedback will be visible to the tutor and our quality assurance team.
        `,
        app_url: "https://edubridge-drab.vercel.app/",
        company_name: "Edu-Bridge",
        subject_prefix: "Welcome to ",
        action_text: "Review",
        action_url: `https://edubridge-drab.vercel.app/student?mentorid=${templateParams.mentorId}`,
      }
    }

    console.log('Sending Otp Mail Template:', emailData);

    try {
      await axios.post(this.API_URL, emailData, {
        headers: {
          'Content-Type': 'application/json',
          Origin: `${this.configService.get("BACKEND_BASE_URL")}`, // this.configService.get<string>('EMAIL_SERVICE_ORIGIN'),
          'User-Agent': 'EmailJS/1.0',
        },
      });

    } catch (error) {
      console.error('Error sending verification email:', error);
      throw error;
    }

  }

}
