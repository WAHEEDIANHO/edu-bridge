import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';

export class ForgetPasswordDto {

  @ApiProperty({required: true})
  @IsEmail()
  email: string;
}