import { Request } from 'express';
import { Injectable } from '@nestjs/common';

@Injectable()
export class ExtractToken {
  extractTokenFromHeader(request: Request): string | undefined{
    const [type, token] = request.headers.authorization?.split(' ') ?? [];
    return type === 'Bearer' ? token : undefined;
  }
}