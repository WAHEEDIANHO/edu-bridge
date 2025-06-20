import { ApiProperty, ApiTags, PartialType } from '@nestjs/swagger';
import { IsEmail, IsString, Matches } from 'class-validator';
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

  @ApiProperty()
  @IsString()
  middleName?: string;

  @ApiProperty()
  @IsString()
  lastName: string;

  @ApiProperty()
  @IsString()
  gender: UserGender;

  // @ApiProperty()
  role: UserRole;

}