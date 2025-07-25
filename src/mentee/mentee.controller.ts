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
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { MenteeService } from './mentee.service';
import { CreateMenteeDto } from './dto/create-mentee.dto';
import { UpdateMenteeDto } from './dto/update-mentee.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { UserService } from '../user/user.service';
import { User, UserRole } from '../user/entities/user.entity';
import { Mentee } from './entities/mentee.entity';
import { ValidationPipe } from '../utils/validation.pipe';
import { AuthGuard } from 'src/auth/guard/auth.guard';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorator/role.decorator';
import { PaginationQueryDto } from '../utils/dto/pagination-query.dto';
import { PreferSubjectDto } from './dto/prefer-subject-dto';
import { MenteeSubject } from './entities/mentee_subject.entity';
import { Booking } from '../booking/entities/booking.entity';
import { Mentor } from '../mentor/entities/mentor.entity';

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

    // if(user.role === UserRole.Student) {
    //   return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, "User is already a student", {}));
    // }

    await this.userService.saveUserAsync({
      ...user,
      role: UserRole.Student
    } as User)

    console.log(user, "registered user")
    const mentee = new Mentee()
    mentee.user = user;
    mentee.id = user.id;
    mentee.level = createMenteeDto.level;
    mentee.location = createMenteeDto.location;
    mentee.profilePictureUrl = createMenteeDto.profilePictureUrl;
    mentee.preferredSubjects = [];
    if(createMenteeDto?.preferredSubjects?.length > 0) {
      createMenteeDto.preferredSubjects.forEach((ps) => {
        const subject = new MenteeSubject();
        subject.subjectId = ps.subjectId.toUpperCase();
        subject.menteeId = mentee.id;
        mentee.preferredSubjects.push(subject);
      });
    }
    // const the = [createMenteeDto?.preferredSubjects?.map((ps) => ({ subjectId: ps.subjectId, mentee: mentee }))]
    await this.menteeService.create(mentee);
    return res.status(HttpStatus.CREATED).json(res.formatResponse(HttpStatus.CREATED, "Mentee created successfully", {}));
  }

  // @Get()
  // findAll() {
  //   return this.menteeService.findAll();
  // }
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.Student)
  @Get('me')
  async getMyDetails(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const { user: authUser }: any = req;
    const mentee = await this.menteeService.findByUserId(authUser.sub);
    return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentee found", mentee));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.Student)
  @Post("prefer-subjects")
  async setPreferredSubjects(@Req() req: Request, @Body() menteeSubjectDto: PreferSubjectDto, @Res() res: Response): Promise<Response> {
    const { user: authUser }: any = req;
    const mentee = await this.menteeService.findByUserId(authUser.sub);
    if (!mentee) return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "Mentee not found", {}));
    const subject = new MenteeSubject();
    subject.menteeId = mentee.id;
    subject.subjectId = menteeSubjectDto.subjectId.toUpperCase();
    if(!mentee?.preferredSubjects) mentee.preferredSubjects = [];
    mentee.preferredSubjects.push(subject);
    await this.menteeService.update(mentee);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentee subject updated", {}));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.ADMIN)
  @Get("upcoming-schedule")
  async getDailySchedule(@Req() req: Request, @Query() query: PaginationQueryDto<Booking>, @Res() res: Response): Promise<Response> {
    const { sub } = req.user as any;
    const mentor = await this.menteeService.findByUserId(sub);
    if (!mentor) {
      return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.NOT_FOUND, "you are not a mentor"));
    }

    const schedules = await this.menteeService.upComingSchedule(query, mentor.id) //await this.availabilityService.findAll({ ...query, day: Object.values(DayOfWeek)[new Date().getDay()], mentor: { id: mentor?.id }  } as PaginationQueryDto<AvailabilitySlot>, ['mentor', 'bookings']);

    console.log(schedules, "=========================");
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "booking retrieved successfully", schedules));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.ADMIN)
  @Get("tutor")
  async getMyTutor(@Req() req: Request, @Query() query: PaginationQueryDto<any>, @Res() res: Response): Promise<Response>
  {
    const { sub } = req.user as any;
    const mentee = await this.menteeService.findByUserId(sub);
    if (!mentee) {
      return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.NOT_FOUND, "you are not a mentee"));
    }

    const result = await this.menteeService.getMyTutor(query, mentee.id);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "tutor retrieved successfully", result));
  }


  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    const mentee = await this.menteeService.findById(id, ['user']);
    return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentee found", mentee));
  }




  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateMenteeDto: UpdateMenteeDto) {
  //   return this.menteeService.update(+id, updateMenteeDto);
  // }
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response): Promise<Response>
  {
    await this.menteeService.delete(id);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentee deleted", {}));
  }
}
