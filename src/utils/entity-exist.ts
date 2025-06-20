
import { NotFoundException } from '@nestjs/common';
import { FindOptionsWhere, Repository } from 'typeorm';
import { IEntity } from './abstract/database/i-enity';

export async function ensureEntityExists<T extends IEntity>(
  repository: Repository<T>,
  id: string,
  entityName: string,
  where?:  FindOptionsWhere<T>
): Promise<T> {
  const entity = await repository.findOneBy(where || { id } as any);

  if (!entity) {
    throw new NotFoundException(`${entityName} with ID "${id}" not found`);
  }

  return entity;
}