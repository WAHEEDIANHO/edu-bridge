import { ResponseFormat } from '../response-formatter.middleware';
interface User {

}
declare global {
  namespace Express {
    interface Response {
      formatResponse: (status: number, message: string, data?: any) => ResponseFormat

    }
  }
}


// declare global {
//   namespace Express {
//     interface Request {
//       user?: User
//     }
//   }
// }

export  {}