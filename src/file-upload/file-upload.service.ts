import { v2 as cloudinary } from 'cloudinary';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FileUploadService {

  constructor(private readonly configService: ConfigService) {
    console.log(configService.get("CLOUDINARY_NAME"))
    cloudinary.config({
      cloud_name: configService.get("CLOUDINARY_NAME"),
      api_key: configService.get("CLOUDINARY_API_KEY"),
      api_secret: configService.get("CLOUDINARY_API_SECRET")
    })
  }
  getFileUploader() {
    return cloudinary;
  }
}