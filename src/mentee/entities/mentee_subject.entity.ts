import { CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryColumn, Unique, UpdateDateColumn } from 'typeorm';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
import { Subject } from '../../admin/modules/subject/entities/subject.entity';
import { Mentee } from './mentee.entity';



@Entity("tbl_mentee_subject")
@Unique(["subject", "mentee"])
export class MenteeSubject implements IEntity {

  id: string;

  @PrimaryColumn()
  menteeId: string;

  @PrimaryColumn()
  subjectId: string;

  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;


  @ManyToOne(() => Subject)
  subject: Subject;

  @ManyToOne(() => Mentee)
  mentee: Mentee;


}