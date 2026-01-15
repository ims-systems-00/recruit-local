import { Request, Response, NextFunction } from "express";
import { ISession } from "@rl/types";
import "../../types/request-extension";
import { IQuotationPublicSession } from "../../types/quotation-public-session";

interface RequestObject {
  body: any;
  query: any;
  params: any;
  cookies: any;
  session: ISession;
  quotationPublicSession: IQuotationPublicSession;
  file?: any;
  ip: string;
  method: string;
  url: string;
  path: string;
  header: (name: string) => string | undefined;
  headers: object;
}

interface ResponseObject {
  statusCode: number;
  cookies?: Array<{ name: string; value: string; options?: object }>;
  clearCookie?: string[];
  [key: string]: any;
}

export type ControllerParams = {
  req: RequestObject;
};

export function handleController(controller: ({ req }: ControllerParams) => Promise<ResponseObject>) {
  return (req: Request, res: Response, next: NextFunction) => {
    // prepare all the necessary request object that the controller needs
    const requestObject: RequestObject = {
      body: req.body,
      query: req.query,
      params: req.params,
      cookies: req.cookies,
      session: req.session,
      quotationPublicSession: req.quotationPublicSession,
      file: null,
      ip: req.ip,
      method: req.method,
      url: req.originalUrl,
      path: req.path,
      header: req.header,
      headers: req.headers,
    };

    // call the controller function with the prepared request object and send the response to the client also call the global error handler if any error occurs
    controller({ req: requestObject })
      .then((response) => {
        const { statusCode, cookies, clearCookie } = response;

        if (cookies?.length > 0) {
          cookies.forEach((cookie) => {
            const { name, value, options } = cookie;
            res.cookie(name, value, options);
          });
        }

        if (clearCookie?.length > 0) {
          clearCookie.forEach((cookie) => {
            res.clearCookie(cookie);
          });
        }

        // Exclude cookies and clearCookie from the response object
        delete response.cookies;
        delete response.clearCookie;

        res.status(statusCode).json(response);
      })
      .catch(next);
  };
}
