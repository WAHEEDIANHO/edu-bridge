import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Res,
  HttpStatus,
  Put,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MentorService } from './mentor.service';
import { CreateMentorDto } from './dto/create-mentor.dto';
import { UpdateMentorDto } from './dto/update-mentor.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { request, Request, Response } from 'express';
import { UserService } from '../auth/user.service';
import { User } from '../auth/entities/user.entity';
import { Mentor } from './entities/mentor.entity';
import { ValidationPipe } from '../utils/validation.pipe';
import { AuthGuard } from '../auth/guard/auth.guard';

@Controller('mentor')
@ApiTags("Mentor")
export class MentorController {
  constructor(
    private readonly mentorService: MentorService,
    private readonly userService: UserService,
    ) {}

  @Post("register")
  async create(@Body(new ValidationPipe()) createMentorDto: CreateMentorDto, @Res() res: Response): Promise<Response> {
    let user  = await this.userService.findByUsername(createMentorDto.email);
    if(user == null) user = await this.userService.createUser(createMentorDto) as User;

    const mentor = new Mentor();
    mentor.user = user;
    mentor.bio = createMentorDto.bio;
    mentor.availability = createMentorDto.availability;
    mentor.introVideoUrl = createMentorDto.introVideoUrl;
    mentor.isVerified = false;
    mentor.location = createMentorDto.location;
    mentor.profilePictureUrl = createMentorDto.profilePictureUrl;
    mentor.ratePerHour = createMentorDto.ratePerHour;
    mentor.subject = createMentorDto.subject;

    await this.mentorService.create(mentor);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentor created successfully", {}));
  }


  @ApiBearerAuth()
  @Post("become-mentor")
  @UseGuards(AuthGuard)
  async becomeMentor(@Body() createMentorDto: CreateMentorDto, @Res() res: Response, @Req() req: Request): Promise<Response> {
    const { user } = req
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentor", user));
  }

  // @Get()
  // async findAll() {
  //   return this.mentorService.findAll();
  // }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    const mentor = await this.mentorService.findById(id);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentor found successfully", mentor));
  }

  // @Put(':id')
  // async update(@Param('id') id: string, @Body() updateMentorDto: UpdateMentorDto) {
  //   return this.mentorService.update(+id, updateMentorDto);
  // }
  //
  // @Delete(':id')
  // async remove(@Param('id') id: string) {
  //   return this.mentorService.remove(+id);
  // }
}
