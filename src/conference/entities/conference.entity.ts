import { Entity } from 'typeorm';
import { DbEntity } from '../../utils/abstract/database/db-entity';
import { IEntity } from '../../utils/abstract/database/i-enity';

@Entity("tbl_conference")
export class Conference extends DbEntity implements IEntity{

  // @
}
