import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  BadRequestException,
  HttpStatus, UseGuards, Req, UseInterceptors,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { ValidationPipe } from '../utils/validation.pipe';
import { ApiBearerAuth, ApiExcludeController, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Request, Response } from 'express';
import { Roles } from '../auth/decorator/role.decorator';
import { RoleGuard } from '../auth/guard/role.guard';
import { UserRole } from './entities/user.entity';

@ApiExcludeController()
@ApiTags("User")
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async create( @Body(new ValidationPipe()) createUserDto: CreateUserDto, @Res() res: Response ): Promise<Response> {
    const user = await this.userService.createUser(createUserDto);
    if(user == null) throw new BadRequestException("unable to create user")
    return res.status(HttpStatus.OK).json(user);
  }

  @Get("resend-verification-email/{email}")
  async resendVerificationEmail(@Param('email') email: string, @Res() res: Response): Promise<Response> {
    const user = await this.userService.findByUsername(email);
    if (!user) {
      return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "User not found", {}));
    }
    if (user.isVerified) {
      return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, "User is already verified", {}));
    }

    await this.userService.sendVerificationMail(user);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Verification email sent successfully", {}));
  }


  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get("me")
  async findAll(@Req() req: Request, @Res() res: Response): Promise<Response> {
    let { user }: any = req;
    if (!user) {
      return res.status(HttpStatus.UNAUTHORIZED).json(res.formatResponse(HttpStatus.UNAUTHORIZED, "Unauthorized", {}));
    }
    user = await this.userService.findByUsername(user.username);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Users fetched successfully", user));
  }

  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    const user = await this.userService.findById(id);
    if (!user) {
      return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "User not found", {}));
    }
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "User found successfully", user));
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
  //   return this.userService.update(+id, updateUserDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.userService.remove(+id);
  // }
}
