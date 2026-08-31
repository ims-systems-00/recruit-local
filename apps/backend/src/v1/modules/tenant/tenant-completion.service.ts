import { Types } from "mongoose";
import { Tenant } from "../../../models";
import { TENANT_COMPLETION_SECTIONS, StoredCompletion } from "@rl/types";
import { computeCompletion } from "@rl/utils";

const filledStr = (v: unknown): boolean => typeof v === "string" && v.trim().length > 0;
const filledArr = (v: unknown): boolean => Array.isArray(v) && v.length > 0;
const filledNum = (v: unknown): boolean => typeof v === "number" && !Number.isNaN(v);

/**
 * Recompute and persist an organisation's profile completion.
 *
 * Unlike the candidate job profile, every input lives on the tenant document
 * itself, so this is a cheap, synchronous, document-only calculation — no queue
 * and no related-collection lookups. Called by the tenant service on create/update.
 *
 * Returns the lean stored completion, or null if the tenant id is invalid/missing.
 * Callers that need the labelled breakdown expand it via `expandCompletion`.
 */
export const recomputeTenantCompletion = async (
  tenantId: string | Types.ObjectId
): Promise<StoredCompletion | null> => {
  if (!tenantId || !Types.ObjectId.isValid(tenantId)) return null;

  const tenant = await Tenant.findById(tenantId);
  if (!tenant) return null;

  // Keyed by field, matching TENANT_COMPLETION_SECTIONS — each one scores on its own.
  const filled: Record<string, boolean> = {
    name: filledStr(tenant.name),
    description: filledStr(tenant.description),
    industry: filledStr(tenant.industry),
    type: filledStr(tenant.type as unknown as string),
    size: filledNum(tenant.size),
    phone: filledStr(tenant.phone),
    email: filledStr(tenant.email),
    officeAddress: filledStr(tenant.officeAddress),
    logo: filledStr(tenant.logoSquareSrc) || filledStr(tenant.logoRectangleSrc),
    profileImage: Boolean(tenant.profileImageId),
    website: filledStr(tenant.website),
    linkedIn: filledStr(tenant.linkedIn),
    missionStatement: filledStr(tenant.missionStatement),
    visionStatement: filledStr(tenant.visionStatement),
    coreProducts: filledStr(tenant.coreProducts),
    coreServices: filledStr(tenant.coreServices),
    values: filledArr(tenant.values),
  };

  const { percentage, completeFields, completeSections } = computeCompletion(
    TENANT_COMPLETION_SECTIONS,
    Object.keys(filled).filter((key) => filled[key])
  );

  const computedAt = new Date();
  const completion: StoredCompletion = { percentage, completeFields, completeSections, computedAt };
  await Tenant.updateOne({ _id: tenant._id }, { $set: { completion } });

  return completion;
};
