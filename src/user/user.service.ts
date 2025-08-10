import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { HashPassword } from '../utils/hash-password';
import { JwtService } from '@nestjs/jwt';
import { EmailServiceService } from '../email-service/email-service.service';
import { ConfigService } from '@nestjs/config';
import { UpdateUserDto } from './dto/update-user.dto';
// import { ensureEntityExists } from '../utils/entity-exists';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userModel: Repository<any>,
    private hashPassword: HashPassword,
    private jwtService: JwtService,
    private emailService: EmailServiceService,
    private configService: ConfigService,
) {}

  async findByUsername(email: string): Promise<User> {
    // return this.userModel.findOne();
    const user = this.userModel.findOne({ where: { email } });
    if (!user) throw new NotFoundException("user not found");
    return user;
  }

  async findById(id: string): Promise<User> {
    const user = this.userModel.findOne({ where: { id } });
    if (!user) throw new NotFoundException("user not found");
    return user;
  }


  async createUser(createUserDto: CreateUserDto, googleId?: string, isVerified?: boolean): Promise<User | null>  {
    let user = await this.findByUsername(createUserDto.email);

    if (!user) {
      const newUser = this.userModel.create({
        ...createUserDto,
        username: createUserDto.email,
        role: googleId ? UserRole.Student : UserRole.USER, // Default role
        googleId: googleId,
        isVerified,
      });

      newUser.password = await this.hashPassword.hashPasswordAsync(createUserDto.password);
      user = await this.userModel.save(newUser);


      // const token = this.jwtService.sign({ id: user.id, email: user.email }, {expiresIn: "2 days"});
      // await this.emailService.sendVerificationMail({
      //   verificationUrl: "http://localhost:3000/auth/verify-email/" + token,
      //   email: user.email,
      //   name: `${user.firstName} ${user.lastName}`,
      // })
    }

    this.sendVerificationMail(user);
    return user
  }

  async sendVerificationMail(user: User): Promise<void> {
    if (!user || !user.email) {
      throw new UnprocessableEntityException("User data is required");
    }

    const token = this.jwtService.sign({ id: user.id, email: user.email }, { expiresIn: "2 days", secret: this.configService.get('SECRET_KEY') });
    await this.emailService.sendVerificationMail({
      verificationUrl: `${this.configService.get("BACKEND_BASE_URL")}/auth/verify-email/` + token,
      email: user.email,
      name: `${user.firstName} ${user.lastName}`,
    });
    console.log("mail sent")
  }

  async verifyUser(token: string): Promise<void>{
    const { id } = this.jwtService.verify(token);
    const user = await this.findById(id);
    user.isVerified = true;
    await this.userModel.save(user);
    // console.log(val)
  }

  async saveUserAsync(user: User): Promise<User> {
    if (!user) throw new UnprocessableEntityException("User data is required");
    return await this.userModel.save(user);
  }

  async changePassword(user: User, newPassword: string) {

    if (!user) throw new UnprocessableEntityException("User data is required");
    if (!newPassword) throw new UnprocessableEntityException("New password is required");

    user.password = await this.hashPassword.hashPasswordAsync(newPassword);
    return await this.userModel.save(user);
  }

  async update(id: string, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException("User not found");

    // Update user properties
    Object.assign(user, updateUserDto);

    // Hash password if it is provided
    if (updateUserDto.password) {
      user.password = await this.hashPassword.hashPasswordAsync(updateUserDto.password);
    }

    return await this.userModel.save(user);
  }
}