import { DbEntity } from '../../../../utils/abstract/database/db-entity';
import { IEntity } from '../../../../utils/abstract/database/i-enity';
import { Column, CreateDateColumn, Entity, OneToMany, PrimaryColumn, UpdateDateColumn } from 'typeorm';
import { MenteeSubject } from '../../../../mentee/entities/mentee_subject.entity';


@Entity('tbl_subject')
export class Subject implements IEntity {

  @PrimaryColumn({ type: 'varchar', length: 255, unique: true })
  id: string;

  @OneToMany(() => MenteeSubject, (subject) => subject.subject)
  menteeSubjects: MenteeSubject[];

  @CreateDateColumn()
  createdAt?: Date;
  @UpdateDateColumn()
  updatedAt?: Date;


  toJSON() {
    delete this.createdAt;
    delete this.updatedAt;
    return this;
  }
}
