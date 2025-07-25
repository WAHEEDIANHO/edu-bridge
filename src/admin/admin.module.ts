import { Module } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';
import { SubjectController } from './modules/subject/subject.controller';
import { SubjectService } from './modules/subject/subject.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Subject } from './modules/subject/entities/subject.entity';

@Module({
  controllers: [AdminController, SubjectController],
  providers: [AdminService, SubjectService],
  imports: [TypeOrmModule.forFeature([Subject])],
})
export class AdminModule {}
