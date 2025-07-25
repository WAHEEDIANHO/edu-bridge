import { PaginationQueryDto } from '../../utils/dto/pagination-query.dto';
import { Session } from '../entities/session.entity';

export class SessionQueryDto extends PaginationQueryDto<Session> {

}