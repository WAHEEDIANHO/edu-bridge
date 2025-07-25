import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ExtractToken } from '../../utils/extract-token';

@Injectable()
export class AuthGuard implements CanActivate {

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private extractToken: ExtractToken
    ) {}
  async canActivate(context: ExecutionContext): Promise<boolean>  {

    const request = context.switchToHttp().getRequest();
    const token = this.extractToken.extractTokenFromHeader(request);
    if (!token) {
      throw new UnauthorizedException();
    }

    try {
      console.log("trying")
      const payload = await this.jwtService.verifyAsync(token, { secret: this.configService.get('SECRET_KEY') });
      console.log(payload);
      request['user'] = payload;
    }catch {
      throw new UnauthorizedException('Invalid token');
    }
    // const requiredRole = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
    //   context.getHandler(),
    //   context.getClass(),
    // ]);
    //
    // if (!requiredRole) return true;
    // console.log(user)
    // return requiredRole.some((role) => user.role?.includes(role));

    return true;
  }
}