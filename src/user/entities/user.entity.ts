import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';
// import { Entity as DbEntity } from '../../utils/abstract/database/entity';
// import { IEntity } from '../../utils/abstract/database/i.entity';
// import { Student } from '../../student/entities/student.entity';
// import { Teacher } from '../../teacher/entities/teacher.entity';
//

export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  Teacher = 'teacher',
  Student = 'student'
}

export enum UserGender {
  m = 'male',
  f = 'female'
}


@Entity({ name: 'tbl_users' })
export class User extends DbEntity implements IEntity {

  @Column({  nullable: false, unique: true })
  username: string;
  @Column({  nullable: false, unique: true })
  email: string
  @Column({ nullable: false })
  password?: string;
  @Column({ type: 'varchar', nullable: true })
  googleId?: string;
  @Column({ nullable: false })
  firstName: string;
  @Column({ nullable: true})
  middleName?: string;
  @Column({ nullable: false })
  lastName: string;
  @Column({ nullable: true })
  profilePicture?: string;
  @Column({type: 'varchar', enum: UserRole, nullable: false, default: UserRole.USER})
  role: UserRole;
  @Column({ default: false })
  isAdmin: boolean;
  @Column({ default: false })
  isVerified: boolean;
  @Column({type: 'varchar', enum: UserGender, nullable: true})
  gender: UserGender;

  // @OneToOne(() => Student, (student: Student) => student.user, { onDelete: 'CASCADE' })
  // student?: Student;
  //
  // @OneToOne(() => Teacher, (teacher: Teacher) => teacher.user, { onDelete: 'CASCADE' })
  // teacher?: Teacher;

  // @OneToOne(() )

  toJSON() {
    delete this.password;
    // delete this.createdAt;
    // delete this.updatedAt;
    return this;
  }
}
