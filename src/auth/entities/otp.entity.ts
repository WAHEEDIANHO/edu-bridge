import { Column, Entity } from 'typeorm';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';


@Entity("tbl_otps")
export class Otp extends DbEntity implements IEntity {

  @Column({ nullable: false })
  otp: string;
  @Column({ nullable: false })
  email: string;
  @Column({  default: false })
  isUsed: boolean;

  // toJSON() {
  //   return {
  //     id: this.id,
  //     email: this.email,
  //     otp: this.otp,
  //     isUsed: this.isUsed,
  //     createdAt: this.createdAt
  //   };
  // }
}