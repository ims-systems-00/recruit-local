import { Request, Response, NextFunction } from "express";
import { trimQuery } from "../helper/utility";

export const customQueryParser = (req: Request, res: Response, next: NextFunction) => {
  req.query = trimQuery(req.query);

  next();
};
