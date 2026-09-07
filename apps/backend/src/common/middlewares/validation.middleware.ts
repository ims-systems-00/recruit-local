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

/**
 * Query validation that keeps Joi's coerced value.
 *
 * `validate("query")` only reports errors — `helper/validate.ts` throws away the
 * `value` Joi returns, so `.default()`s never apply and `page` stays the string
 * "2". A list builder needs real numbers and booleans, so this writes the parsed
 * value back. Express 4 lets us reassign `req.query`; Express 5 would not.
 */
const validateQuery = (schema: Schema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { value, error } = schema.validate(req.query, { abortEarly: false, convert: true });
    if (error) return next(new BadRequestException(error.details.map((detail) => detail.message).join(", ")));

    req.query = value;
    next();
  };
};

export { validate, validateQuery };
