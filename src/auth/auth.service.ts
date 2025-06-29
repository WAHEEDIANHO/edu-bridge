import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from './user.service';
import { HashPassword } from '../utils/hash-password';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {

  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
    private readonly hashPassword: HashPassword
  ) {}

  async login(loginAuthDto: LoginDto): Promise<any>
  {
    const user = await this.userService.findByUsername(loginAuthDto.email);

    console.log(user);

    if (!user) throw new UnauthorizedException("Invalid login credential");
    if( !user.isVerified) throw new UnauthorizedException("Email is not verified");
    if (!(await this.hashPassword.comparePasswordAsync(loginAuthDto.password, user.password as string))) {
      throw new UnauthorizedException("Invalid login credential");
    }

    const payload = { username: user.username, sub: user.id, role: user.role, isAdmin: user.isAdmin };

    return {
      access_token: this.jwtService.sign(payload),
      user: user
    };
  }

}