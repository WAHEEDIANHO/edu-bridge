import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, Matches } from 'class-validator';

export class  VerifyForgetPasswordDto {
  @ApiProperty({ required: true })
  @IsEmail()
  email: string;
  @ApiProperty({ required: true })
  @IsString()
  @Matches(/^[0-9]{6}$/, { message: 'OTP must be a 6-digit number' })
  otp: string;
  @ApiProperty({ required: true })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, { message: 'Password too weak' })
  password: string
  @ApiProperty({ required: true })
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, { message: 'Confirm Password too weak' })
  confirmPassword: string;
}