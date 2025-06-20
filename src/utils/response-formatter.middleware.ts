import { Injectable } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

export interface ResponseFormat {
  status: number;
  message: string;
  data?: any;
}


@Injectable()
export class ResponseFormatterMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    res.formatResponse = (status: number, message: string, data?: any): ResponseFormat => {
      return {
        status,
        message,
        data,
      };
    };

    // res.formatResponse = (message: string, status: number = 500): ResponseFormat => {
    //   return {
    //     status,
    //     message,
    //   };
    // };

    next();
  }
}