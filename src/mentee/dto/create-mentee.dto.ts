import { CreateUserDto } from '../../auth/dto/create-user.dto';
import { MenteeLevel } from '../abstraction/enums/mentee-level.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export class CreateMenteeDto extends CreateUserDto{

  @ApiProperty({required: false, enum: MenteeLevel})
  @IsEnum(MenteeLevel, {message: 'level must be one of the following values: PRIMARY, UNDERGRADUATE, POSTGRADUATE'})
  level: MenteeLevel;

  @ApiProperty({required: false})
  @IsString({message: 'value must be a string'})
  preferredSubjects: string;

  @ApiProperty({required: false})
  @IsString({message: 'value must be a string'})
  profilePictureUrl: string;

  @ApiProperty({required: false})
  @IsString({message: 'value must be a string'})
  location: string;
}
