import { Controller, Get, Post, Body, Patch, Param, Delete, Res, HttpStatus, Query } from '@nestjs/common';
import { SubjectService } from './subject.service';
import { CreateSubjectDto } from './dto/create-subject.dto';
import { ValidationPipe } from '../../../utils/validation.pipe';
import { Response } from 'express';
import { Subject } from './entities/subject.entity';
import { SubjectQueryDto } from './dto/subject-query-dto';

@Controller('subject')
export class SubjectController {
  constructor(private readonly subjectService: SubjectService) {}

  @Post()
  async create(@Body(new ValidationPipe()) createSubjectDto: CreateSubjectDto, @Res() res: Response): Promise<Response> {

    const subject = new Subject();
    subject.id = createSubjectDto.name.toUpperCase();
    await this.subjectService.create(subject);
    return res.status(HttpStatus.CREATED).json(res.formatResponse(HttpStatus.CREATED, 'Subject created successfully'));
  }

  @Get()
  async findAll(@Query() query: SubjectQueryDto, @Res() res: Response): Promise<Response> {
    const subjects = await this.subjectService.findAll(query)
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, 'Subjects retrieved successfully', subjects));
  }



  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    const subject = await  this.subjectService.findById(id);
    return res.status(HttpStatus.OK).json(res.formatResponse(HttpStatus.OK, "successful", subject));
  }
  //
  // // @Patch(':id')
  // // update(@Param('id') id: string, @Body() updateSubjectDto: UpdateSubjectDto) {
  // //   return this.subjectService.update(+id, updateSubjectDto);
  // // }
  //
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response): Promise<Response> {
    await this.subjectService.delete(id);
    return res.status(HttpStatus.OK ).json(res.formatResponse(HttpStatus.OK, 'Successfully deleted'));
  }
}
