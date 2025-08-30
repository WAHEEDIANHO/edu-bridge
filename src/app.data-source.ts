import { DataSource } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';


// export const AppDataSource: DataSource = new DataSource({
//   type: 'postgres',
//   host: process.env.DB_HOST || '',
//   port: parseInt(process.env.DB_PORT as string, 10) || 5432,
//   username: process.env.DB_USERNAME || 'edu_bridge_user',
//   password: process.env.DB_PASSWORD || 'sSRCICTqX2I3kNnCgVCGYqjVIrSFVnzE',
//   database: process.env.DB_NAME || 'edu-bridge',
//   synchronize: true,
//   logging: false,
//   entities: [__dirname + '/**/*.entity{.ts,.js}'],
//   // migrations: [__dirname + '/migrations/**/*{.ts,.js}'],
//   subscribers: [],
//   extra: {
//     trustServerCertificate: true, // Required for self-signed certs
//   },
//   ssl: {
//     rejectUnauthorized: false
//   }
// })

@Injectable()
export class AppDataSource {

  constructor(private readonly configService: ConfigService) {}

  createDataSource(): DataSource {
    return new DataSource({
      type: 'postgres',
      host: this.configService.get<string>('DB_HOST', 'localhost'),
      port: this.configService.get<number>('DB_PORT', 5432),
      username: this.configService.get<string>('DB_USERNAME', 'edu_bridge_user'),
      password: this.configService.get<string>('DB_PASSWORD', 'sSRCICTqX2I3kNnCgVCGYqjVIrSFVnzE'),
      database: this.configService.get<string>('DB_NAME', 'edu-bridge'),
      synchronize: false,
      logging: true,
      // entities: [__dirname + '/**/*.entity{.ts,.js}'],
      extra: {
        trustServerCertificate: true, // Required for self-signed certs
      },
      ssl: {
        rejectUnauthorized: false
      }
    });
  }
}