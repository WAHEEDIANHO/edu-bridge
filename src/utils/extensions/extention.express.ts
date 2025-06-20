import { ResponseFormat } from '../response-formatter.middleware';

declare global {
  namespace Express {
    interface Response {
      formatResponse: (status: number, message: string, data?: any) => ResponseFormat

    }
  }
}


export  {}