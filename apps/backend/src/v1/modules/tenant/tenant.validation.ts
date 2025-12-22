import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";
import { TENANT_STATUS_ENUMS } from "@inrm/types";

// Custom validation for MongoDB ObjectId
const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

export const createBodySchema = Joi.object({
  name: Joi.string().max(300).required().label("Name"),
  description: Joi.string().allow("", null).label("Description"),
  industry: Joi.string().max(50).label("Industry"),
  size: Joi.number().label("Size"),
  phone: Joi.string().allow("", null).label("Phone"),
  email: Joi.string().email().label("Office Email"),
  logoSquareSrc: Joi.string().uri().label("Logo Square Src"),
  logoSquareStorage: Joi.object().label("Logo Square Storage"),
  logoRectangleSrc: Joi.string().uri().label("Logo Rectangle Src"),
  logoRectangleStorage: Joi.object().label("Logo Rectangle Storage"),
  addressBuilding: Joi.string().max(50).label("Address Building"),
  addressStreet: Joi.string().max(50).label("Address Street"),
  addressStreet2: Joi.string().max(50).label("Address Street 2"),
  addressCity: Joi.string().max(50).label("Address City"),
  addressPostCode: Joi.string().max(50).label("Address Post Code"),
  addressStateProvince: Joi.string().max(50).label("Address State Province"),
  addressCountry: Joi.string().max(50).label("Address Country"),
  addressInMap: Joi.string().label("Address In Map"),
  status: Joi.string()
    .valid(...Object.values(TENANT_STATUS_ENUMS))
    .optional()
    .label("Status"),
  registeredAddress: Joi.string().allow("", null).label("Registered Address"),
  website: Joi.string().uri().label("Website"),
  linkedIn: Joi.string().uri().label("LinkedIn"),
});

export const updateBodySchema = Joi.object({
  name: Joi.string().max(300).label("Name"),
  industry: Joi.string().max(50).label("Industry"),
  size: Joi.number().label("Size"),
  phone: Joi.number().label("Phone"),
  officeEmail: Joi.string().email().label("Office Email"),
  addressBuilding: Joi.string().max(50).label("Address Building"),
  addressStreet: Joi.string().max(50).label("Address Street"),
  addressStreet2: Joi.string().max(50).label("Address Street 2"),
  addressCity: Joi.string().max(50).label("Address City"),
  addressPostCode: Joi.string().max(50).label("Address Post Code"),
  addressStateProvince: Joi.string().max(50).label("Address State Province"),
  addressCountry: Joi.string().max(50).label("Address Country"),
  addressInMap: Joi.string().label("Address In Map"),
  status: Joi.string()
    .valid(...Object.values(TENANT_STATUS_ENUMS))
    .optional()
    .label("Status"),
  registeredAddress: Joi.string().allow("", null).label("Registered Address"),
  website: Joi.string().uri().label("Website"),
  linkedIn: Joi.string().uri().label("LinkedIn"),
});

export const idParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
});

export const logoUpdateParamsSchema = Joi.object({
  id: Joi.string().custom(objectIdValidation).required().label("ID"),
  logoStorage: Joi.string().valid("logoSquareStorage", "logoRectangleStorage").required().label("Logo Storage"),
});
export const bulkDeleteBodySchema = Joi.object({
  ids: Joi.array().items(Joi.string().custom(objectIdValidation).label("id")).max(100).label("ids"),
});
export const logoUpdateBodySchema = Joi.object({
  logoSquareStorage: Joi.object({
    Name: Joi.string().label("Name"),
    Bucket: Joi.string().label("Bucket"),
    Key: Joi.string().label("Key"),
  })
    .optional()
    .label("Logo Square Storage"),
  logoRectangleStorage: Joi.object({
    Name: Joi.string().label("Name"),
    Bucket: Joi.string().label("Bucket"),
    Key: Joi.string().label("Key"),
  })
    .optional()
    .label("Logo Rectangle Storage"),
})
  .or("logoSquareStorage", "logoRectangleStorage")
  .label("Logo Storage");
