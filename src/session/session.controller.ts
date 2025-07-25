import { Controller, Get, Post, Body, Patch, Param, Delete, Query, Res, HttpStatus } from '@nestjs/common';
import { SessionService } from './session.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { UpdateSessionDto } from './dto/update-session.dto';
import { ApiExcludeController } from '@nestjs/swagger';
import { SessionQueryDto } from './dto/session-query-dto';
import { Response } from 'express';


@ApiExcludeController()
@Controller('session')
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}


  @Get()
  async findAll(@Query() query: SessionQueryDto, @Res() res: Response): Promise<Response>
  {
    const session = await this.sessionService.findAll(query, ['slot']);



    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, 'Sessions retrieved successfully', session));
  }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.sessionService.findOne(+id);
  // }
  //
  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateSessionDto: UpdateSessionDto, @Res() res: Response): Promise<Response> {
    const session = await this.sessionService.findById(id);
    if(!session) return res.status(HttpStatus.NOT_FOUND).json(res.formatResponse(HttpStatus.NOT_FOUND, 'Session not found', null));

    session.completed =  updateSessionDto.completed || session.completed;
    await this.sessionService.update(session);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, 'Session updated', session));
  }
  //
  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.sessionService.remove(+id);
  // }
}
