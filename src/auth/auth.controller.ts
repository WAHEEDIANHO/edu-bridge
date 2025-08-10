import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus, Param,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { ApiExcludeEndpoint, ApiProperty, ApiTags } from '@nestjs/swagger';
import { ValidationPipe } from '../utils/validation.pipe';
import { Request, Response } from 'express';
import { UserService } from '../user/user.service';
import { UserRole } from '../user/entities/user.entity';
import { AuthGuard } from '@nestjs/passport';
import { IGoogleUser } from './types/i-google.user';
import { ForgetPasswordDto } from './dto/forgot-password.dto';
import { VerifyForgetPasswordDto } from './dto/verify-forget-password.dto';
import { WalletService } from 'src/transaction/wallet/wallet.service';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly walletService: WalletService
    // private readonly hashPassword: HashPassword,
    // private readonly emailService: EmailServiceService,
    // private readonly jwtService: JwtService
  ) {}

  @Post('login')
  async login( @Body(new ValidationPipe()) loginDto: LoginDto, @Res() res: Response ): Promise<Response> {
    const { access_token, user } = await this.authService.login(loginDto);
    delete user?.password;
    delete user?.createdAt;
    delete user?.updatedAt;
    const accountNo = await this.walletService.getWalletByUserEmail(loginDto.email);
    return res
      .status(HttpStatus.OK)
      .json(
        res.formatResponse(HttpStatus.OK, 'login successfully', {
          access_token,
          user: {
            ...user,
            accountNo: accountNo?.accountNo
          }
        }),
      );
  }

  // @UseInterceptors(CacheInterceptor)
  // @Post('create-user')
  // async createUser( @Body(new ValidationPipe()) createUserDto: CreateUserDto, @Res() res: Response ): Promise<Response> {
  //   const user = await this.userService.createUser(createUserDto);
  //   if(user == null) throw new BadRequestException("unable to create user")
  //   return res.status(HttpStatus.OK).json(user);
  // }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async signWithGoogle(@Res() res: Response) {}

  @ApiExcludeEndpoint()
  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthRedirect(@Res() res: Response, @Req() req: Request) {
    const googleUser = req.user as IGoogleUser;
    let user = await this.userService.findByUsername(
      googleUser.email,
    );
    if (user != null && user?.googleId != null) {
      // User already register just logged them in and  get token
      const { access_token, user } = await this.authService.login({
        email: googleUser.email,
        password: googleUser.id, // Using Google ID as password for login
      });
      return res
        .status(HttpStatus.OK)
        .json(
          res.formatResponse(HttpStatus.OK, 'login successfully', {
            access_token,
            user,
          }),
        );
    } else if (user != null && user?.googleId == null)
      return res
        .status(HttpStatus.BAD_REQUEST)
        .json(
          res.formatResponse(
            HttpStatus.BAD_REQUEST,
            'User already exists but not registered with Google',
          ),
        );
    else {
      // User not registered, create a new user
      const newUser = await this.userService.createUser({
        email: googleUser.email,
        password: googleUser.id, // Using Google ID as password for registration
        role: UserRole.USER, // Default role
        firstName: googleUser.firstName,
        lastName: googleUser.lastName,
        // gender: UserGender.m,
      }, googleUser.id, true);

      const { access_token, user } = await this.authService.login({
        email: googleUser.email,
        password: googleUser.id, // Using Google ID as password for login
      });

      return res
        .status(HttpStatus.OK)
        .json(
          res.formatResponse(HttpStatus.OK, 'login successfully', {
            access_token,
            user,
          }),
        );
    }
  }

  // @ApiExcludeEndpoint()
  @Get('verify-email/:token')
  async verifyEmail(@Res() res: Response, @Req() req: Request, @Param('token') token: string): Promise<Response> {
    await this.userService.verifyUser(token);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, 'Email verified successfully', {}));
  }

  @Post("forgot-password")
  async forgotPassword(@Body(new ValidationPipe())  forgetPasswordDto: ForgetPasswordDto, @Res() res: Response): Promise<Response> {

    const user = await this.userService.findByUsername(forgetPasswordDto.email);
    if (!user) {
      return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, 'User not found', {}));
    }
    if( !user.isVerified) {
      return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, 'User is not verified', {}));
    }
    // Logic to send reset password email
    // console.log(otp)
    await this.authService.generateOtp(user.email);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, 'Reset password email sent', {}));
  }

  @Post("verify-forgot-password")
  async verifyForgotPassword(@Body(new ValidationPipe()) verifyDto: VerifyForgetPasswordDto, @Body('newPassword') newPassword: string, @Res() res: Response): Promise<Response> {
    const { password, confirmPassword, email, otp } = verifyDto;
    if ( password !== confirmPassword) {
      return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, 'Passwords do not match', {}));
    }

    const user = await  this.userService.findByUsername(email);
    if (!user) {
      return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, 'User not found', {}));
    }

    // Logic to verify the token and reset the password
    if(!await this.authService.verifyOtp(email, otp)) {
      return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, 'Invalid OTP', {}));
    }
    await this.userService.changePassword(user, password);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, 'Password reset successfully', {}));
  }
}