// types/express.d.ts or @types/express/index.d.ts
import { ISession } from "@inrm/types";
import { IQuotationPublicSession } from "./quotation-public-session";
// Extend the Request interface to include the `user` property
declare global {
  namespace Express {
    interface Request {
      session?: ISession;
      quotationPublicSession?: IQuotationPublicSession;
    }
  }
}
