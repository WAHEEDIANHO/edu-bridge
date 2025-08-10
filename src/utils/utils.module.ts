import { Module } from '@nestjs/common';
import { ExtractToken } from './extract-token';
import { HashPassword } from './hash-password';
import { ResponseFormatterMiddleware } from './response-formatter.middleware';

@Module({
  providers: [ExtractToken, HashPassword, ExtractToken, HashPassword],
  exports: [ExtractToken, HashPassword, ExtractToken, HashPassword]
})
export class UtilsModule {}