import { IGeneralService } from './i-general.service';
import { IEntity } from '../database/i-enity';
import { FindOptionsWhere, Repository } from 'typeorm';
import { PaginatedResultDto } from '../../dto/paginated-result.dto';
import { PaginationQueryDto } from '../../dto/pagination-query.dto';

export class GeneralService<T extends IEntity> implements IGeneralService<T>{
  constructor(
    private readonly repository: Repository<T>
    ) { }

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
    paginationReqDto: PaginationQueryDto<T>,
    relations: string[] = [],
  ): Promise<PaginatedResultDto<T>> {
    const {
      limit = 10,
      cursor,
      cursorField = 'id',
      order = 'DESC',
    } = paginationReqDto;

    // Remove reserved pagination keys
    ['cursor', 'limit', 'order', 'cursorField'].forEach((key) => delete paginationReqDto[key]);

    const field = String(cursorField);
    const flatFilter = this.flattenFilters(paginationReqDto);
    const query = this.repository.createQueryBuilder('entity')
      .orderBy(`entity.${field}`, order)
      .take(+limit + 1);

    // Eagerly join direct relations
    relations.forEach((relation) => {
      query.leftJoinAndSelect(`entity.${relation}`, relation);
    });

    // Cursor-based pagination
    if (cursor) {
      query.andWhere(`entity.${field} = :cursor`, { cursor });
    }

    // Parser for values with operators
    const parseValue = (raw: any) => {
      if (raw === 'null') return { operator: 'IS', value: null };
      if (typeof raw !== 'string') return { operator: '=', value: raw };

      if (raw.startsWith('like:')) return { operator: 'LIKE', value: `%${raw.slice(5)}%` };
      if (raw.startsWith('in:')) {
        try {
          const arr = JSON.parse(raw.slice(3));
          return { operator: 'IN', value: Array.isArray(arr) ? arr : [arr] };
        } catch {
          return { operator: 'IN', value: raw.slice(3).split(',') };
        }
      }
      const match = raw.match(/^([<>]=?|=)(.+)$/);
      if (match) return { operator: match[1], value: match[2].trim() };
      return { operator: '=', value: raw };
    };

    // Dynamic filters
    Object.entries(flatFilter).forEach(([key, raw]) => {
      const paramKey = key.replace(/\./g, '_');
      const { operator, value } = parseValue(raw);

      const parts = key.split('.');
      if (parts.length === 2) {
        const [relation, field] = parts;

        // Auto join if missing
        if (!relations.includes(relation)) {
          relations.push(relation);
          query.leftJoinAndSelect(`entity.${relation}`, relation);
        }

        if (operator === 'IS' && value === null) {
          query.andWhere(`${relation}.${field} IS NULL`);
        } else if (operator === 'IN') {
          query.andWhere(`${relation}.${field} IN (:...${paramKey})`, { [paramKey]: value });
        } else {
          query.andWhere(`${relation}.${field} ${operator} :${paramKey}`, { [paramKey]: value });
        }
      } else {
        const field = key;
        if (operator === 'IS' && value === null) {
          query.andWhere(`entity.${field} IS NULL`);
        } else if (operator === 'IN') {
          query.andWhere(`entity.${field} IN (:...${paramKey})`, { [paramKey]: value });
        } else {
          query.andWhere(`entity.${field} ${operator} :${paramKey}`, { [paramKey]: value });
        }
      }
    });

    // Execute and paginate
    const result = await query.getMany();
    let hasNextPage = false;
    let hasPreviousPage = false;
    let nextCursor: T[keyof T] | null = null;
    let previousCursor: T[keyof T] | null = null;
    let data = result;

    if (order === 'ASC') {
      if (result.length > limit) {
        hasPreviousPage = true;
        data = result.slice(0, limit);
        previousCursor = hasPreviousPage ? data[data.length - 1][cursorField] : null;
      } else if (result.length > 0) {
        previousCursor = hasPreviousPage ? data[data.length - 1][cursorField] : null;
      }
      if (data.length > 0) {
        nextCursor = cursor ? data[0][cursorField] : null;
        hasNextPage = !!cursor;
      }
      data = data.reverse();
    } else {
      if (result.length > limit) {
        hasNextPage = true;
        data = result.slice(0, limit);
        nextCursor = hasNextPage ? data[data.length - 1][cursorField] : null;
      } else if (result.length > 0) {
        nextCursor = hasNextPage ? data[data.length - 1][cursorField] : null;
      }
      if (data.length > 0) {
        previousCursor = cursor ? data[0][cursorField] : null;
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


  async  findById(id: any, relations?: string[]): Promise<T|null>
  {
    return await this.repository.findOne({where: { id: id }, relations})
  }

  private flattenFilters(obj: any, prefix = ''): Record<string, any> {
    const flat: Record<string, any> = {};
    for (const key of Object.keys(obj)) {
      const value = obj[key];
      const newKey = prefix ? `${prefix}.${key}` : key;

      if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
        Object.assign(flat, this.flattenFilters(value, newKey));
      } else {
        flat[newKey] = value;
      }
    }
    return flat;
  }
}