import { IEntity } from '../abstract/database/i-enity';

export class PaginatedResultDto<T extends IEntity> {
  data: T[];
  nextCursor: T[keyof T] | null;
  hasNextPage: boolean;
  hasPreviousPage?: boolean;
  previousCursor: T[keyof T] | null;
}