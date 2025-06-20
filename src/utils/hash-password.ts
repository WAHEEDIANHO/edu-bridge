import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class HashPassword {
  async hashPasswordAsync(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
  }

  async comparePasswordAsync(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}