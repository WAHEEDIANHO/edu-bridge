import { ConflictException, Injectable, NotFoundException, UnprocessableEntityException } from '@nestjs/common';
import { User, UserRole } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcryptjs';
import { HashPassword } from '../utils/hash-password';
// import { ensureEntityExists } from '../utils/entity-exists';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private userModel: Repository<any>,
    private hashPassword: HashPassword
  ) {}

  async findByUsername(email: string): Promise<User> {
    // return this.userModel.findOne();
    const user = this.userModel.findOne({ where: { email } });
    if (!user) throw new NotFoundException("user not found");
    return user;
  }
  async createUser(createUserDto: CreateUserDto): Promise<User | null>  {
    let user = await this.findByUsername(createUserDto.email);

    if (!user) {
      const newUser = this.userModel.create({
        ...createUserDto,
        username: createUserDto.email,
        role: UserRole.USER, // Default role
      });

      newUser.password = await this.hashPassword.hashPasswordAsync(createUserDto.password);
      user = await this.userModel.save(newUser);
    }

    return user
  }
}