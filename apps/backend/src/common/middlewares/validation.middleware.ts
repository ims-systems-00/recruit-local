import { Request, Response, NextFunction } from "express";
import { Schema } from "joi";
import { validate as _validate, BadRequestException } from "../helper";

const validate = (validationObjectName: string) => {
  return (schema: Schema) => {
    return async (req: Request, res: Response, next: NextFunction) => {
      try {
        const errors = _validate(schema, req[validationObjectName]);
        if (!errors) return next();

        const errorMessages = Object.values(errors).join(", ");
        throw new BadRequestException(errorMessages);
      } catch (error) {
        next(error);
      }
    };
  };
};

export { validate };
