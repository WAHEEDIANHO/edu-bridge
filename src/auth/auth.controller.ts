import { Body, Controller, HttpStatus, Post, Res, UploadedFile, UseInterceptors } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiBody, ApiConsumes, ApiTags } from '@nestjs/swagger';
import { ValidationPipe } from '../utils/validation.pipe';
import { Response } from 'express';
import { UserService } from './user.service';
import { HashPassword } from '../utils/hash-password';
import { CreateUserDto } from './dto/create-user.dto';
import { UserRole } from './entities/user.entity';
import { CacheInterceptor } from '@nestjs/cache-manager';

@Controller('auth')
@ApiTags("Auth")
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly hashPassword: HashPassword,
  ) {}

  @Post('login')
  async login(@Body(new ValidationPipe()) loginDto: LoginDto, @Res() res: Response): Promise<Response> {

    const { access_token, user } = await this.authService.login(loginDto);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, 'login successfully', { access_token, user }));

  }

  // @UseInterceptors(CacheInterceptor)
  @Post('create-user')
  async createUser(@Body(new ValidationPipe()) createUserDto: CreateUserDto, @Res() res: Response): Promise<Response>{
    const user = await this.userService.createUser(createUserDto);
    return res.status(HttpStatus.OK).json(user);
  }

}