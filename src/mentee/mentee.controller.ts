import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus } from '@nestjs/common';
import { MenteeService } from './mentee.service';
import { CreateMenteeDto } from './dto/create-mentee.dto';
import { UpdateMenteeDto } from './dto/update-mentee.dto';
import { ApiTags } from '@nestjs/swagger';
import { Response } from 'express';
import { UserService } from '../auth/user.service';
import { User } from '../auth/entities/user.entity';
import { Mentee } from './entities/mentee.entity';
import { ValidationPipe } from '../utils/validation.pipe';

@Controller('mentee')
@ApiTags("Mentee")
export class MenteeController {
  constructor(
    private readonly menteeService: MenteeService,
    private readonly userService: UserService,
    ) {}

  @Post("register")
  async create(@Body(new ValidationPipe()) createMenteeDto: CreateMenteeDto, @Res() res: Response): Promise<Response> {
    let user: User = await this.userService.findByUsername(createMenteeDto.email);
    if(!user) user = await this.userService.createUser(createMenteeDto) as User;

    const mentee = new Mentee()
    mentee.user = user;
    mentee.level = createMenteeDto.level;
    mentee.location = createMenteeDto.location;
    mentee.preferredSubjects = createMenteeDto.preferredSubjects;
    mentee.profilePictureUrl = createMenteeDto.profilePictureUrl;
    await this.menteeService.create(mentee);
    return res.status(HttpStatus.CREATED).json(res.formatResponse(HttpStatus.CREATED, "Mentee created successfully", {}));
  }

  // @Get()
  // findAll() {
  //   return this.menteeService.findAll();
  // }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    const mentee = await this.menteeService.findById(id);
    return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentee found", mentee));
  }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateMenteeDto: UpdateMenteeDto) {
  //   return this.menteeService.update(+id, updateMenteeDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.menteeService.remove(+id);
  // }
}
