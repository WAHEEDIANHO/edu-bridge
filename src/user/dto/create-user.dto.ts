import { ApiProperty, ApiTags, PartialType } from '@nestjs/swagger';
import { IsEmail, IsEnum, IsOptional, IsString, Matches } from 'class-validator';
import { UserGender, UserRole } from '../entities/user.entity';

export class CreateUserDto  {

  // constructor(
  //   email: string,
  //   password: string,
  //   firstName: string,
  //   lastName: string,
  //   gender: UserGender,
  //   role: UserRole,
  //   middleName?: string,
  // ) {
  //   this.email = email;
  //   this.password = password;
  //   this.firstName = firstName;
  //   this.middleName = middleName;
  //   this.lastName = lastName;
  //   this.gender = gender;
  //   this.role = role
  //   this.middleName = middleName;
  // }

  @ApiProperty()
  @IsEmail()
  email: string

  @ApiProperty()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/, { message: 'Password too weak' })
  password: string

  @ApiProperty()
  @IsString()
  firstName: string;

  @ApiProperty({required: false})
  // @IsString()
  middleName?: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  // @ApiProperty()
  // @IsEnum(["male", "female"], { message: "value must be male or female"})
  // gender?: UserGender;

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  profilePicture?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  zipCode?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  state?: string

  @ApiProperty({ required: false })
  @IsString()
  @IsOptional()
  country?: string

  // @ApiProperty()
  role: UserRole;

}