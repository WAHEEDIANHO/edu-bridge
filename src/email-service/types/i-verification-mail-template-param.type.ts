export interface IVerificationMailTemplateParamType {
  email: string;
  verificationUrl: string;
  name: string
}

export interface IOtpMailTemplateParamType {
  email: string;
  otp: string;
}