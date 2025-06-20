import { IGeneralService } from './i-general.service';
import { IEntity } from '../database/i-enity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PaginatedResultDto } from '../../dto/paginated-result.dto';

export class GeneralService<T extends IEntity> implements IGeneralService<T>{
  constructor(private repository: Repository<T>) { }

  async create(data: T): Promise<boolean> {
    // this.repository.create(data);
    await this.repository.save(data);
    return true;
  }

  async delete(id: string): Promise<boolean> {
    const res = await this.repository.delete(id);
    return res.affected as number > 0;
  }

  async update(data: T): Promise<boolean> {
    await this.repository.save(data);
    return true;
  }


  async findAll(
    limit=10,
    cursor?: string,
    cursorField: keyof T = 'id' as keyof T,
    order: 'ASC' | 'DESC' = 'DESC',
    filters: FindOptionsWhere<T> = {},
    relations: string[] = [],
  ): Promise<PaginatedResultDto<T>> {
    const field = String(cursorField);
    // console.log("filters",  limit)

    const query = this.repository.createQueryBuilder('entity')
      .orderBy(`entity.${field}`, order)
      .take(+limit+1);

    // Correct way to join each relation
    relations.forEach(relation => {
      query.leftJoinAndSelect(`entity.${relation}`, relation);
    });


    if (cursor) {
      const operator =  order == 'ASC' ? '>' : '<';
      query.andWhere(`entity.${field} ${operator} :cursor`, { cursor });
    }

    // applying filter
    Object.keys(filters).forEach((key) => {
      query.andWhere(`entity.${key} = :${key}`, { [key]: (filters as any)[key] });
    })

    // console.log(query.getSql())
    const result = await query.getMany();

    let hasNextPage = false;
    let hasPreviousPage = false;
    let nextCursor: T[keyof T] | null = null;
    let previousCursor: T[keyof T] | null = null;
    let data = result;

    // console.log(result.length, typeof limit, result.length, limit, result.length > limit);

    if (order == 'ASC') {
      if (result.length > limit) {
        hasPreviousPage = true;
        data = result.slice(0, limit);
        // console.log(data)
        previousCursor = hasPreviousPage ? data[data.length - 1][cursorField] : null;
      } else if (result.length > 0) {
        previousCursor = hasPreviousPage ? data[data.length - 1][cursorField] : null;
      }

      if (data.length > 0) {
        nextCursor = !!cursor ? data[0][cursorField] : null;
        hasNextPage = !!cursor;
      }

      data = data.reverse()
    }

    else {
      if (result.length > limit) {
        hasNextPage = true;
        data = result.slice(0, limit);
        nextCursor = hasNextPage ? data[data.length - 1][cursorField] : null;
      } else if (result.length > 0) {
        nextCursor = hasNextPage ? data[data.length - 1][cursorField] : null;
      }

      if (data.length > 0) {
        previousCursor = !!cursor ? data[0][cursorField] : null;
        hasPreviousPage = !!cursor;
      }
    }


    return {
      data,
      hasNextPage,
      hasPreviousPage,
      nextCursor,
      previousCursor,
    };

  }

  async findById(id: any): Promise<T|null> {
    return await this.repository.findOne({where: { id: id }})
  }
}