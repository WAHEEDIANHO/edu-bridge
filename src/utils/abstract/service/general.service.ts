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

    ['cursor', 'limit', 'order', 'cursorField'].forEach((key) => delete paginationReqDto[key]);

    const field = String(cursorField);
    const flatFilter = this.flattenFilters(paginationReqDto);

    const query = this.repository.createQueryBuilder('entity')
      .orderBy(`entity.${field}`, order)
      .take(+limit + 1);

    relations.forEach((relation) => {
      query.leftJoinAndSelect(`entity.${relation}`, relation);
    });

    if (cursor) {
      query.andWhere(`entity.${field} = :cursor`, { cursor });
    }

    const parseValue = (raw: any) => {
      if (raw === 'null') return { operator: 'IS', value: null };
      if (raw === 'all') return { operator: null, value: null }; // skip this field
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

    // 🔥 Handle OR conditions
    const orRaw = flatFilter.or || flatFilter.$or;
    if (orRaw) {
      const orConditions = Array.isArray(orRaw) ? orRaw : [orRaw];

      const orQuery = orConditions.map((cond, i) => {
        const [fieldPath, valRaw] = cond.split('=');
        const { operator, value } = parseValue(valRaw);
        const paramKey = `or_param_${i}`;

        const parts = fieldPath.split('.');
        let clause: string;

        if (parts.length === 2) {
          const [relation, field] = parts;

          // Auto join relation if not already joined
          if (!relations.includes(relation)) {
            relations.push(relation);
            query.leftJoinAndSelect(`entity.${relation}`, relation);
          }

          clause = `${relation}.${field} ${operator} :${paramKey}`;
        } else {
          clause = `entity.${fieldPath} ${operator} :${paramKey}`;
        }

        return {
          clause,
          paramKey,
          paramValue: value,
        };
      });

      const orSql = orQuery.map(q => q.clause).join(' OR ');
      const orParams = Object.fromEntries(orQuery.map(q => [q.paramKey, q.paramValue]));

      query.andWhere(`(${orSql})`, orParams);

      delete flatFilter.or;
      delete flatFilter.$or;
    }


    // Process remaining filters as before
    Object.entries(flatFilter).forEach(([key, raw]) => {
      const paramKey = key.replace(/\./g, '_');
      const { operator, value } = parseValue(raw);

      if (operator === null) {
        return; // skip filter
      }

      const parts = key.split('.');
      if (parts.length === 2) {
        const [relation, field] = parts;

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
        if (operator === 'IS' && value === null) {
          query.andWhere(`entity.${key} IS NULL`);
        } else if (operator === 'IN') {
          query.andWhere(`entity.${key} IN (:...${paramKey})`, { [paramKey]: value });
        } else {
          query.andWhere(`entity.${key} ${operator} :${paramKey}`, { [paramKey]: value });
        }
      }
    });

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
        previousCursor = data[data.length - 1]?.[cursorField] ?? null;
      }
      if (data.length > 0) {
        nextCursor = cursor ? data[0]?.[cursorField] : null;
        hasNextPage = !!cursor;
      }
      data = data.reverse();
    } else {
      if (result.length > limit) {
        hasNextPage = true;
        data = result.slice(0, limit);
        nextCursor = data[data.length - 1]?.[cursorField] ?? null;
      }
      if (data.length > 0) {
        previousCursor = cursor ? data[0]?.[cursorField] : null;
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