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
  Query, Put,
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
import { UpdateMentorDto } from '../mentor/dto/update-mentor.dto';
import { UpdateUserDto } from '../user/dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RatingService } from '../rating/rating.service';
import { Rating } from '../rating/entities/rating.entity';
import { CreateRatingDto } from '../rating/dto/create-rating.dto';
import { SessionService } from '../session/session.service';
import { session } from 'passport';
import { Session } from '../session/entities/session.entity';
import { CompetencySubject } from '../mentor/entities/competency-subject.entity';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Controller('mentee')
@ApiTags("Mentee")
export class MenteeController {
  constructor(
    private readonly menteeService: MenteeService,
    private readonly userService: UserService,
    private readonly ratingService: RatingService,
    private readonly sessionService: SessionService,
    @InjectQueue('payment') private paymentProcessor: Queue,
    @InjectRepository(MenteeSubject) private readonly menteeSubjectRepo: Repository<MenteeSubject>,
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
    await this.menteeService.createMenteeWithWallet(mentee);
    return res.status(HttpStatus.CREATED).json(res.formatResponse(HttpStatus.CREATED, "Mentee created successfully with wallet", {}));
  }

  @Put("update-profile")
  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.Student)
  async update(@Req() req: Request, @Body(new ValidationPipe()) updateMenteeDto: UpdateMenteeDto, @Res() res: Response): Promise<Response> {
    const { username, sub } = req.user as any;
    let user = await this.userService.findByUsername(username);
    const mentee = await this.menteeService.findByUserId(sub);
    if (user == null || mentee == null) return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "User not found", {}));

    delete updateMenteeDto?.email;
    delete updateMenteeDto?.role;
    delete updateMenteeDto?.gender;

    await this.userService.update(user.id, updateMenteeDto as UpdateUserDto);

    // if (updateMenteeDto?.preferredSubjects?.length != null) updateMenteeDto.preferredSubjects.forEach((ps: any) => ps.menteeId = mentee.id);

    // updating competency subjects if set
    if(updateMenteeDto?.preferredSubjects?.length != null) {
      await this.menteeSubjectRepo.delete({ menteeId: mentee.id });

      const newSubjects = updateMenteeDto.preferredSubjects.map(cs => {
        const subject = new MenteeSubject();
        subject.subjectId = cs.subjectId.toUpperCase();
        subject.menteeId = mentee.id;
        subject.mentee = mentee;
        return subject;
      });

      // 3. Save all at once
      await this.menteeSubjectRepo.save(newSubjects);

      delete updateMenteeDto.preferredSubjects;
    }


    Object.assign(mentee, updateMenteeDto);
    await this.menteeService.update(mentee);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentee updated successfully", {}));
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
  @Get("upcoming-sessions")
  async getDailySchedule(@Req() req: Request, @Query() query: PaginationQueryDto<Booking>, @Res() res: Response): Promise<Response> {
    const { sub } = req.user as any;
    const mentee = await this.menteeService.findByUserId(sub);
    if (!mentee) {
      return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.NOT_FOUND, "you are not a mentor"));
    }

    const schedules = await this.menteeService.upComingSchedule(query, mentee.id) //await this.availabilityService.findAll({ ...query, day: Object.values(DayOfWeek)[new Date().getDay()], mentor: { id: mentor?.id }  } as PaginationQueryDto<AvailabilitySlot>, ['mentor', 'bookings']);

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
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.ADMIN)
  @Post("rate-tutor-performance")
  async rateTutor(@Req() req: Request, @Body(new ValidationPipe()) createRatingDto: CreateRatingDto, @Res() res: Response): Promise<Response>
  {
    const { sub } = req.user as any;
    const mentee = await this.menteeService.findByUserId(sub);
    if (!mentee) {
      return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.NOT_FOUND, "you are not a mentee"));
    }

    const session = await this.sessionService.findById(createRatingDto.sessionId);
    if (!session) {
      return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.NOT_FOUND, "session not found, please select a valid session to rate"));
    }

    if(createRatingDto.rate < 0 || createRatingDto.rate > 5 ){
      return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, "invalid rating value"))
    }

    const rating = new Rating();

    rating.mentee = mentee;
    rating.mentor = createRatingDto.mentorId as any;
    rating.rate = createRatingDto.rate;
    rating.session = createRatingDto.sessionId as any;
    rating.comment = createRatingDto.comment;

    session.rating = rating;
    await this.ratingService.create(rating);
    await this.sessionService.update(session);

    if(rating.rate < 3) {
      const job = await this.paymentProcessor.getJob(`payment-${session.id}`);
      if(job) await job.remove();
    }
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "tutor rated successfully"));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.Student, UserRole.ADMIN)
  @Get("summary")
  async getSummary(@Req() req: Request,  @Res() res: Response): Promise<Response>
  {

    const today = new Date();
    today.setHours(0,0,0,0);

    const { sub } = req.user as any;
    const mentee = await this.menteeService.findByUserId(sub);
    if (!mentee) {
      return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.NOT_FOUND, "you are not a mentee"));
    }

    const { data } = await this.sessionService.findAll({mentee: { id: sub }, limit: Number.MAX_SAFE_INTEGER } as PaginationQueryDto<Session>)
    const activeSession = await this.sessionService.findAll({ limit: Number.MAX_SAFE_INTEGER, mentee: {id: sub}, session_date: `>=${today.toISOString().split('T')[0]}`, } as PaginationQueryDto<Session>, ['mentor']);

   const activeTutor = Array.from(new Map(activeSession.data.map((item) => [item.mentor.id, item])).values()).length;
    const sessionBooked = data.length;
    const subjects = mentee.preferredSubjects.length;
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "tutor retrieved successfully", {activeTutor, sessionBooked, subjects}));
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
