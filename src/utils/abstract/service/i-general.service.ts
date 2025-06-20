import { IEntity } from '../database/i-enity';
import { FindOptionsWhere } from 'typeorm';
import { PaginatedResultDto } from '../../dto/paginated-result.dto';

export interface IGeneralService<T extends IEntity> {
  create(data: T): Promise<boolean>;
  delete(id: string): Promise<boolean>
  update (data: T): void;
  findAll(
    limit?: number,
    cursor?: string,
    cursorField?: keyof T,
    order?: 'ASC' | 'DESC',
    filters?: FindOptionsWhere<T>,
    relations?: string[],
  ): Promise<PaginatedResultDto<T>>;
  findById(id: string | number): Promise<T|null>;
}