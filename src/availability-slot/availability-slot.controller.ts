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
  Query,
  UseGuards,
  Req, Inject,
} from '@nestjs/common';
import { AvailabilitySlotService } from './availability-slot.service';
import { CreateAvailabilitySlotDto } from './dto/create-availability-slot.dto';
import { UpdateAvailabilitySlotDto } from './dto/update-availability-slot.dto';
import { Response, Request } from 'express';
import { AvailabilitySlot } from './entities/availability-slot.entity';
import { AvailabilityQuerySlotDto } from './dto/AvailabiltyQueryDto';
import { AuthGuard } from '../auth/guard/auth.guard';
import { Roles } from '../auth/decorator/role.decorator';
import { UserRole } from '../user/entities/user.entity';
import { ApiBearerAuth, ApiExcludeController } from '@nestjs/swagger';
import { ValidationPipe } from '../utils/validation.pipe';
import { PaginationQueryDto } from '../utils/dto/pagination-query.dto';
import { MentorService } from '../mentor/mentor.service';

@ApiExcludeController()
@ApiExcludeController()
@Controller('availability-slot')
export class AvailabilitySlotController {
  constructor(
    private readonly availabilitySlotService: AvailabilitySlotService,
    ) {}

  // @ApiBearerAuth()
  // @UseGuards(AuthGuard)
  // @Roles(UserRole.Teacher)
  // @Post()
  // async create(@Body(new ValidationPipe()) createAvailabilitySlotDto: CreateAvailabilitySlotDto, @Req() req: Request, @Res() res: Response): Promise<Response> {
  //
  //   const { sub } = req.user as any;
  //   if(createAvailabilitySlotDto.participantAllow <= 0) {
  //     return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, "Number of participants allowed must be greater than 0"));
  //   }
  //
  //   if (createAvailabilitySlotDto.startTime >= createAvailabilitySlotDto.endTime) {
  //     return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, "Start time must be before end time"));
  //   }
  //
  //   // const mentor = await this.mentorService.findById(sub, ['competencySubjects']);
  //   // if (!mentor) {
  //   //   return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "Mentor not found"));
  //   // }
  //   //
  //   // if (mentor?.competencySubjects?.length === 0) {
  //   //   return res.status(HttpStatus.BAD_REQUEST).json(res.formatResponse(HttpStatus.BAD_REQUEST, "Mentor must have at least one competency subject"));
  //   // }
  //
  //   const availability = new AvailabilitySlot();
  //
  //   availability.mentor = sub as any
  //   availability.no_of_participant_allow = createAvailabilitySlotDto.participantAllow ;
  //   availability.day = createAvailabilitySlotDto.day;
  //   availability.startTime = createAvailabilitySlotDto.startTime;
  //   availability.endTime = createAvailabilitySlotDto.endTime;
  //   availability.level = createAvailabilitySlotDto.studentLevel;
  //
  //   await this.availabilitySlotService.create(availability);
  //   return res.status(HttpStatus.CREATED).json(res.formatResponse(HttpStatus.CREATED, "successful"));
  // }

  @Get()
  async findAll(@Query() availabilityQuery: AvailabilityQuerySlotDto, @Res() res: Response): Promise<Response> {
    const availability =
      await this.availabilitySlotService.findAll({ ...availabilityQuery } as PaginationQueryDto<AvailabilitySlot>, ['mentor', 'bookings']);

    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentor", availability));
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    const availability = await this.availabilitySlotService.findById(id);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "Mentor found successfully", availability));
  }

  // @Patch(':id')
  // async update(@Param('id') id: string, @Body() updateAvailabilitySlotDto: UpdateAvailabilitySlotDto) {
  //   const availability = await this.service.findById(id);
  //   if (!booking) return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, "no booking with the given Id"));
  //   booking.status = dto.status;
  //   await this.service.update(booking);
  //   return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "OK", booking));
  // }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Roles(UserRole.Teacher, UserRole.ADMIN)
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    await this.availabilitySlotService.delete(id);
    return  res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "successful"));
  }
}
