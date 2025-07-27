import { FileUploadService } from './file-upload.service';
import { CreateFileUploadDto } from './dto/create-file-upload.dto';
import { UpdateFileUploadDto } from './dto/update-file-upload.dto';
import {
  Bind,
  Controller,
  HttpStatus,
  NestInterceptor,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import { v2 as cloudinary } from 'cloudinary';
import { ApiBody, ApiConsumes } from '@nestjs/swagger';
import {  Response } from 'express'

const allowedFormats = ['jpg', 'png', 'jpeg']; // Define allowed formats globally

@Controller('file-upload')
export class FileUploadController {


  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: new CloudinaryStorage({
      cloudinary: cloudinary,
      params: (req, file) => {
        const allowedFormats = ['pdf', 'jpeg', 'jpg', 'gif', 'png', 'svg']; // Add more formats as needed

        return {
          folder: `${((file: Express.Multer.File) => "cv")(file)}`,
          allowed_formats: `${(() => {
            'use strict';
            const ext = file.mimetype.split("/")[1];
            if (allowedFormats.includes(ext)) {
              return ext;
            } else {
              throw new Error('This file format is not supported');
            }
          })()}`,
          public_id: `${((req, file) => {
            const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
            return `${file.fieldname}-${uniqueSuffix}`;
          })(req, file)}`,
          // format: null
        };
      }
    })
  }))
  @Bind(UploadedFile())
  @ApiConsumes("multipart/form-data")
  @ApiBody({
    description: 'File Upload',
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary'
        }
      }
    }
  })
  upload(@UploadedFile() file: Express.Multer.File, @Res() res: Response) {
    return res.status(HttpStatus.CREATED).json({
      msg: "File uploaded successfully!",
      fileUrl: file.path,
      mimetype: file.mimetype
    })
  }
}