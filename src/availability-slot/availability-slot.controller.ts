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
