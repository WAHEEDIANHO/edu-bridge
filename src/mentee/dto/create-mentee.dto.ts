import { CreateUserDto } from '../../user/dto/create-user.dto';
import { MenteeLevel } from '../abstraction/enums/mentee-level.enum';
import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsEnum, IsOptional, IsString } from 'class-validator';
import { Optional } from '@nestjs/common';
import { Type } from 'class-transformer';
import { Mentee } from '../entities/mentee.entity';

class PreferredSubject {
  subjectId: string;
}

export class CreateMenteeDto extends CreateUserDto{

  @ApiProperty({required: false, enum: MenteeLevel})
  @IsEnum(MenteeLevel, {message: 'level must be one of the following values: PRIMARY, UNDERGRADUATE, POSTGRADUATE'})
  level: MenteeLevel;


  @ApiProperty({required: false, example:  [{ subjectId: '12345' }] })
  @IsOptional()
  @IsArray({message: 'preferredSubjects must be an array'})
  preferredSubjects: [{ subjectId: string }];

  @ApiProperty({required: false})
  @IsString({message: 'value must be a string'})
  profilePictureUrl: string;

  @ApiProperty({required: false})
  @IsString({message: 'value must be a string'})
  location: string;
}
