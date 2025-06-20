import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ExtractToken } from '../../utils/extract-token';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private extractToken: ExtractToken
  ) { }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {

    const request = context.switchToHttp().getRequest();
    const user = request?.user;

    if (!user) throw new UnauthorizedException();

    return user.isAdmin;
  }
}