import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';

export class CompetencySubjectDto {
  @ApiProperty()
  @IsUUID()
  subjectId: string;
}