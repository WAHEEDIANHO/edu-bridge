import { ApiProperty } from '@nestjs/swagger';
import { IsUUID } from 'class-validator';


export class PreferSubjectDto {
  @ApiProperty()
  @IsUUID()
  subjectId: string;
}