export interface IVerificationMailTemplateParamType {
  email: string;
  verificationUrl: string;
  name: string
}

export interface IOtpMailTemplateParamType {
  email: string;
  otp: string;
}

export interface ISessionCompleteNotification {
  email: string;
  tutorName: string;
  name: string;
  mentorId: string
}

export interface IEmailParamsBase {
  subject_prefix: string;   // e.g., "Welcome to", "Password Reset from"
  company_name: string;     // e.g., "Acme Corp"
  recipient_name: string;   // e.g., "John"
  main_message: string;      // Main email body text
  additional_info?: string;  // Optional extra note
  company_email: string;     // e.g., "support@example.com"
  app_url: string;           // Link to your homepage or app
  email: string;
}

export interface IEmailParamsWithAction extends IEmailParamsBase {
  action_url: string;  // Link for the button
  action_text: string; // Button label, e.g., "Verify Email"
}
