import { CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { Mentor } from './mentor.entity';
import { Subject } from '../../admin/modules/subject/entities/subject.entity';


@Entity('tbl_competency_subjects')
export class CompetencySubject implements IEntity {

  id: string;

  @PrimaryColumn()
  mentorId: string;

  @PrimaryColumn()
  subjectId: string;

  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;


  toJSON() {
    delete this.createdAt;
    delete this.updatedAt;
    this.id = `${this.subjectId}-${this.mentorId}`;
    return this;
  }

  @ManyToOne(() => Mentor, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mentorId' })
  mentor: Mentor;

  @ManyToOne(() => Subject, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'subjectId' })
  subject: Subject;
}