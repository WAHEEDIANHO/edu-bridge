import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { HashPassword } from '../utils/hash-password';
import { LoginDto } from './dto/login.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Otp } from './entities/otp.entity';
import { Repository } from 'typeorm';
import { EmailServiceService } from '../email-service/email-service.service';

@Injectable()
export class AuthService {

  constructor(
    private readonly userService: UserService,
    private jwtService: JwtService,
    private readonly hashPassword: HashPassword,
    @InjectRepository(Otp) private readonly otpServices: Repository<Otp>,
    private readonly emailService: EmailServiceService,
    private readonly hashText: HashPassword,
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

  async generateOtp(email: string): Promise<string> {
      const otp  = Math.floor(Math.random() * 900000 + 100000).toString(); // Generate a random 6-digit OTP
      let existingOtp = await this.otpServices.findOne({ where: { email } });
      if (existingOtp) {
        // If an OTP already exists for this email, update it
        existingOtp.otp = await this.hashText.hashPasswordAsync(otp);
        await this.otpServices.save(existingOtp);
      } else {
        const encryptedOtp = await this.hashText.hashPasswordAsync(otp);
        const storeOtp = new Otp()
        storeOtp.email = email;
        storeOtp.otp = encryptedOtp;
        await this.otpServices.save(storeOtp);
      }
      await this.emailService.sendOtpMail({otp, email})
      return otp;
  }

  async verifyOtp(email: string, otp: string): Promise<boolean> {
    const existingOtp = await this.otpServices.findOne({ where: { email } });
    console.log(existingOtp, "====================================");
    if (!existingOtp) {
      return false;
    }
    const isValid = await this.hashText.comparePasswordAsync(otp, existingOtp.otp);
    console.log(isValid);
    if (isValid) {
      // Optionally, you can delete the OTP after successful verification
      await this.otpServices.delete(existingOtp.id);
      return true;
    }
    return false;
  }

}