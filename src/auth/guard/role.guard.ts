import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Observable } from 'rxjs';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorator/role.decorator';
import { UserRole } from '../entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ExtractToken } from '../../utils/extract-token';

@Injectable()
export class RoleGuard implements CanActivate {

  constructor(
    private reflector: Reflector,
    private jwtService: JwtService,
    private configService: ConfigService,
    private extractToken: ExtractToken
    ) {}
  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean>  {

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const token = this.extractToken.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    const requiredRole = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRole) return true;
    console.log(user)
    return requiredRole.some((role) => user.role?.includes(role));
  }
}