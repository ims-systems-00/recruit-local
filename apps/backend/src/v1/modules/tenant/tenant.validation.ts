import Joi, { CustomHelpers } from "joi";
import mongoose from "mongoose";
import {
  COMPLIANCE_STANDARDS_TYPES_ENUMS,
  COMPLIANCE_STANDARDS_ENUMS,
  SALES_STAGES_ENUMS,
  PORTFOLIO_TYPE,
  PRODUCER_TRADER_TYPE,
  YES_NO_ENUM,
  TENANT_STATUS_ENUMS,
  CDM_CATEGORY_ENUMS,
  IAF_CODE_ENUMS,
  RISK_LEVEL_ENUMS,
  FSC_STANDARD_TYPE,
  PEFC_STANDARD_TYPE,
  ISO_STANDARD_TYPE,
  VRA_STANDARD_TYPE,
} from "@inrm/types";

// Custom validation for MongoDB ObjectId
const objectIdValidation = (value: string, helpers: CustomHelpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.message({ custom: `"${helpers.state.path.join(".")}" must be a valid ObjectId` });
  }
  return value;
};

export const createBodySchema = Joi.object({
  name: Joi.string().max(300).required().label("Name"),
  industry: Joi.string().max(50).label("Industry"),
  size: Joi.number().label("Size"),
  phone: Joi.string().allow("", null).label("Phone"),
  officeEmail: Joi.string().email().label("Office Email"),
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
  complianceType: Joi.string()
    .valid(...Object.values(COMPLIANCE_STANDARDS_TYPES_ENUMS))
    .label("Compliance Type"),
  standards: Joi.array()
    .items(Joi.string().valid(...Object.values(COMPLIANCE_STANDARDS_ENUMS)))
    .label("Compliance Standards"),
  salesStage: Joi.string()
    .valid(...Object.values(SALES_STAGES_ENUMS))
    .label("Sales stage"),
  addressInMap: Joi.string().label("Address In Map"),
  revenueLocalCurrency: Joi.number().optional().label("Revenue Local Currency"),
  localCurrency: Joi.string().max(10).optional().label("Local Currency"),
  revenueUSD: Joi.number().optional().label("Revenue USD"),
  woodBasedTurnoverLocalCurrency: Joi.number().optional().label("Wood Based Turnover Local Currency"),
  woodBasedTurnoverUSD: Joi.number().optional().label("Wood Based Turnover USD"),
  portfolioType: Joi.string()
    .valid(...Object.values(PORTFOLIO_TYPE))
    .optional()
    .label("Portfolio Type"),
  producerTraderType: Joi.string()
    .valid(...Object.values(PRODUCER_TRADER_TYPE))
    .optional()
    .label("Producer Trader Type"),
  useOfOutsourcers: Joi.string()
    .valid(...Object.values(YES_NO_ENUM))
    .optional()
    .label("Use of Outsourcers"),
  status: Joi.string()
    .valid(...Object.values(TENANT_STATUS_ENUMS))
    .optional()
    .label("Status"),
  cdmCategories: Joi.array()
    .items(Joi.string().valid(...Object.values(CDM_CATEGORY_ENUMS)))
    .label("CDM Categories"),
  iafCodes: Joi.array()
    .items(Joi.string().valid(...Object.values(IAF_CODE_ENUMS)))
    .label("IAF Codes"),
  riskLevel: Joi.string()
    .valid(...Object.values(RISK_LEVEL_ENUMS))
    .optional()
    .label("Risk Level"),
  comment: Joi.string().allow("", null).label("Comment"),
  fullTimeEmployees: Joi.number().optional().label("Full Time Employees"),
  subcontractorsUsed: Joi.number().optional().label("Subcontractors Used"),
  permanentSites: Joi.number().optional().label("Permanent Sites"),
  temporarySites: Joi.number().optional().label("Temporary Sites"),
  organisationalChanges: Joi.string().allow("", null).label("Organisational Changes"),
  hasScopeChanged: Joi.string()
    .valid(...Object.values(YES_NO_ENUM))
    .optional()
    .label("Has Scope Changed"),
  includedScopes: Joi.string().allow("", null).label("Included Scopes"),
  reportingPeriodStartDate: Joi.date().optional().label("Reporting Period Start Date"),
  reportingPeriodEndDate: Joi.date().optional().label("Reporting Period End Date"),
  hasCalculatorChanged: Joi.string()
    .valid(...Object.values(YES_NO_ENUM))
    .optional()
    .label("Has Calculator Changed"),
  registeredAddress: Joi.string().allow("", null).label("Registered Address"),
  fscStandards: Joi.array()
    .items(Joi.string().valid(...Object.values(FSC_STANDARD_TYPE)))
    .label("FSC Standards"),
  pefcStandards: Joi.array()
    .items(Joi.string().valid(...Object.values(PEFC_STANDARD_TYPE)))
    .label("PEFC Standards"),
  isoStandards: Joi.array()
    .items(Joi.string().valid(...Object.values(ISO_STANDARD_TYPE)))
    .label("ISO Standards"),
  vraStandards: Joi.array()
    .items(Joi.string().valid(...Object.values(VRA_STANDARD_TYPE)))
    .label("VRA Standards"),
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
  complianceType: Joi.string()
    .valid(...Object.values(COMPLIANCE_STANDARDS_TYPES_ENUMS))
    .label("Compliance Type"),
  standards: Joi.array()
    .items(Joi.string().valid(...Object.values(COMPLIANCE_STANDARDS_ENUMS)))
    .label("Compliance Standards"),
  salesStage: Joi.string()
    .valid(...Object.values(SALES_STAGES_ENUMS))
    .label("Sales stage"),
  addressInMap: Joi.string().label("Address In Map"),
  revenueLocalCurrency: Joi.number().optional().label("Revenue Local Currency"),
  localCurrency: Joi.string().max(10).optional().label("Local Currency"),
  revenueUSD: Joi.number().optional().label("Revenue USD"),
  woodBasedTurnoverLocalCurrency: Joi.number().optional().label("Wood Based Turnover Local Currency"),
  woodBasedTurnoverUSD: Joi.number().optional().label("Wood Based Turnover USD"),
  portfolioType: Joi.string()
    .valid(...Object.values(PORTFOLIO_TYPE))
    .optional()
    .label("Portfolio Type"),
  producerTraderType: Joi.string()
    .valid(...Object.values(PRODUCER_TRADER_TYPE))
    .optional()
    .label("Producer Trader Type"),
  useOfOutsourcers: Joi.string()
    .valid(...Object.values(YES_NO_ENUM))
    .optional()
    .label("Use of Outsourcers"),
  status: Joi.string()
    .valid(...Object.values(TENANT_STATUS_ENUMS))
    .optional()
    .label("Status"),
  cdmCategories: Joi.array()
    .items(Joi.string().valid(...Object.values(CDM_CATEGORY_ENUMS)))
    .label("CDM Categories"),
  iafCodes: Joi.array()
    .items(Joi.string().valid(...Object.values(IAF_CODE_ENUMS)))
    .label("IAF Codes"),
  riskLevel: Joi.string()
    .valid(...Object.values(RISK_LEVEL_ENUMS))
    .optional()
    .label("Risk Level"),
  comment: Joi.string().allow("", null).label("Comment"),
  fullTimeEmployees: Joi.number().optional().label("Full Time Employees"),
  subcontractorsUsed: Joi.number().optional().label("Subcontractors Used"),
  permanentSites: Joi.number().optional().label("Permanent Sites"),
  temporarySites: Joi.number().optional().label("Temporary Sites"),
  organisationalChanges: Joi.string().allow("", null).label("Organisational Changes"),
  hasScopeChanged: Joi.string()
    .valid(...Object.values(YES_NO_ENUM))
    .optional()
    .label("Has Scope Changed"),
  includedScopes: Joi.string().allow("", null).label("Included Scopes"),
  reportingPeriodStartDate: Joi.date().optional().label("Reporting Period Start Date"),
  reportingPeriodEndDate: Joi.date().optional().label("Reporting Period End Date"),
  hasCalculatorChanged: Joi.string()
    .valid(...Object.values(YES_NO_ENUM))
    .optional()
    .label("Has Calculator Changed"),
  registeredAddress: Joi.string().allow("", null).label("Registered Address"),
  fscStandards: Joi.array()
    .items(Joi.string().valid(...Object.values(FSC_STANDARD_TYPE)))
    .label("FSC Standards"),
  pefcStandards: Joi.array()
    .items(Joi.string().valid(...Object.values(PEFC_STANDARD_TYPE)))
    .label("PEFC Standards"),
  isoStandards: Joi.array()
    .items(Joi.string().valid(...Object.values(ISO_STANDARD_TYPE)))
    .label("ISO Standards"),
  vraStandards: Joi.array()
    .items(Joi.string().valid(...Object.values(VRA_STANDARD_TYPE)))
    .label("VRA Standards"),
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
