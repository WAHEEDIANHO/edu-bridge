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
  Req, Query,
} from '@nestjs/common';
import { MentorService } from './mentor.service';
import { CreateMentorDto } from './dto/create-mentor.dto';
import { UpdateMentorDto } from './dto/update-mentor.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { request, Request, Response } from 'express';
import { UserService } from '../user/user.service';
import { User, UserRole } from '../user/entities/user.entity';
import { Mentor } from './entities/mentor.entity';
import { ValidationPipe } from '../utils/validation.pipe';
import { AuthGuard } from '../auth/guard/auth.guard';
import { MentorQueryDto } from './dto/mentor-query-dto';
import { RoleGuard } from '../auth/guard/role.guard';
import { Roles } from '../auth/decorator/role.decorator';
import { BookingService } from '../booking/booking.service';
import { PaginationQueryDto } from '../utils/dto/pagination-query.dto';
import { Booking } from '../booking/entities/booking.entity';
import { AvailabilitySlotService } from '../availability-slot/availability-slot.service';
import { AvailabilitySlot } from '../availability-slot/entities/availability-slot.entity';
import { DayOfWeek } from '../availability-slot/abstraction/enums/day-of-week.enum';
import { MenteeSubject } from '../mentee/entities/mentee_subject.entity';
import { CompetencySubject } from './entities/competency-subject.entity';
import { PreferSubjectDto } from '../mentee/dto/prefer-subject-dto';
import { CompetencySubjectDto } from './dto/competency-subject-dto';
import { CreateAvailabilitySlotDto } from '../availability-slot/dto/create-availability-slot.dto';


@Controller('mentor')
@ApiTags("Mentor")
export class MentorController {
  constructor(
    private readonly mentorService: MentorService,
    private readonly userService: UserService,
    private readonly availabilityService: AvailabilitySlotService,
    ) {}

  @Post("register")
  async create(@Body(new ValidationPipe()) createMentorDto: CreateMentorDto, @Res() res: Response): Promise<Response> {
    let user  = await this.userService.findByUsername(createMentorDto.email);
    if(user == null) user = await this.userService.createUser(createMentorDto) as User;

    // if(user.role === UserRole.Teacher) {
    //   return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, "User is already a mentor", {}));
    // }

    await this.userService.saveUserAsync({
      ...user,
      role: UserRole.Teacher
    } as User)
    const mentor = new Mentor();
    mentor.user = user;
    mentor.id = user.id;
    mentor.bio = createMentorDto.bio;
    mentor.availability = createMentorDto.availability;
    mentor.introVideoUrl = createMentorDto.introVideoUrl;
    mentor.isVerified = false;
    mentor.location = createMentorDto.location;
    mentor.profilePictureUrl = createMentorDto.profilePictureUrl;
    mentor.ratePerHour = createMentorDto.ratePerHour;
    mentor.subject = createMentorDto.subject;
    mentor.competencySubjects = [];

    if(createMentorDto?.competencySubjects?.length > 0) {
      createMentorDto.competencySubjects.forEach((cs) => {
        const subject = new CompetencySubject();
        subject.subjectId = cs.subjectId;
        subject.mentorId = mentor.id;
        mentor?.competencySubjects?.push(subject);
      });
    }

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


  @Get("get-all")
  async findAll(@Query() mentorQuery: MentorQueryDto, @Res() res: Response): Promise<Response> {
    const mentors = await this.mentorService.findAll(mentorQuery, ['user', 'competencySubjects', 'mySlots']);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentor", mentors));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.Teacher)
  @Get("me")
  async getMyDeails(@Req() req: Request, @Res() res: Response): Promise<Response> {
    const { user }: any = req;
    console.log(user, "=========================");
    const mentor = await this.mentorService.findById(user.id, ['user']);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentor found successfully", mentor));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.Teacher, UserRole.ADMIN)
  @Get("upcoming-schedule")
  async getDailySchedule(@Req() req: Request, @Query() query: PaginationQueryDto<Booking>, @Res() res: Response): Promise<Response> {
    const { sub } = req.user as any;
    const mentor = await this.mentorService.findByUserId(sub);
    if (!mentor) {
      return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.NOT_FOUND, "you are not a mentor"));
    }

    const schedules = await this.mentorService.getUpcomingSession(query, mentor.id) //await this.availabilityService.findAll({ ...query, day: Object.values(DayOfWeek)[new Date().getDay()], mentor: { id: mentor?.id }  } as PaginationQueryDto<AvailabilitySlot>, ['mentor', 'bookings']);

    // console.log(schedules, "=========================");
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "booking retrieved successfully", schedules));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.Teacher)
  @Get("student")
  async geyMyStudent(@Req() req: Request, @Res() res: Response): Promise<Response>
  {
    const { sub } = req.user as any;
    const mentor = await this.mentorService.findByUserId(sub);
    if (!mentor) {
      return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.NOT_FOUND, "you are not a mentor"));
    }


    const result = await this.mentorService.geyMyStudent(mentor.id);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "student retrieved successfully", result));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.Teacher)
  @Post("competency-subjects")
  async setCompetencySubjects(@Req() req: Request, @Body() competencySubjectDto: CompetencySubjectDto, @Res() res: Response): Promise<Response> {
    const { user: authUser }: any = req;
    const mentor = await this.mentorService.findByUserId(authUser.sub);
    if (!mentor) return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "Mentee not found", {}));
    const subject = new CompetencySubject();
    subject.mentorId = mentor.id;
    subject.subjectId = competencySubjectDto.subjectId.toUpperCase();

    if(!mentor?.competencySubjects) mentor.competencySubjects=[];

    mentor.competencySubjects.push(subject);
    await this.mentorService.update(mentor);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "competency subject updated", {}));
  }

  @Get("available")
  async getAvailableMentors(@Query() query: MentorQueryDto, @Res() res: Response): Promise<Response> {
    const mentors = await this.mentorService.getAvailableMentors(query);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentor", mentors));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles(UserRole.Teacher)
  @Post("create-slot")
  async createSlot(@Body(new ValidationPipe()) createAvailabilitySlotDto: CreateAvailabilitySlotDto, @Req() req: Request, @Res() res: Response): Promise<Response> {

    const { sub } = req.user as any;
    if(createAvailabilitySlotDto.participantAllow <= 0) {
      return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, "Number of participants allowed must be greater than 0"));
    }

    if (createAvailabilitySlotDto.startTime >= createAvailabilitySlotDto.endTime) {
      return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, "Start time must be before end time"));
    }

    const mentor = await this.mentorService.findById(sub, ['competencySubjects']);
    if (!mentor) {
      return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "Mentor not found"));
    }

    if (mentor?.competencySubjects?.length === 0) {
      return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, "Mentor must have at least one competency subject"));
    }

    const availability = new AvailabilitySlot();

    availability.mentor = sub as any
    availability.no_of_participant_allow = createAvailabilitySlotDto.participantAllow ;
    availability.day = createAvailabilitySlotDto.day;
    availability.startTime = createAvailabilitySlotDto.startTime;
    availability.endTime = createAvailabilitySlotDto.endTime;
    availability.level = createAvailabilitySlotDto.studentLevel;

    await this.availabilityService.create(availability);
    return res.status(HttpStatus.CREATED).json(res.formatResponse(HttpStatus.CREATED, "successful"));
  }





  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    const mentor = await this.mentorService.findById(id, ['user']);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentor found successfully", mentor));
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard, RoleGuard)
  @Roles(UserRole.ADMIN)
  @Get("{id}/verify")
  async verifymentor(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    const mentor = await this.mentorService.findById(id);
    if (!mentor) {
      return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "Mentor not found", {}));
    }
    await this.mentorService.verifyMentor(mentor);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentor verified successfully", mentor));
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
