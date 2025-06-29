import { PartialType } from '@nestjs/swagger';
import { CreateMenteeDto } from './create-mentee.dto';

export class UpdateMenteeDto extends PartialType(CreateMenteeDto) {}
