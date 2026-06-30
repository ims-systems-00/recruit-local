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

  const complete: Record<string, boolean> = {
    basics:
      filledStr(tenant.name) &&
      filledStr(tenant.description) &&
      filledStr(tenant.industry) &&
      filledStr(tenant.type as unknown as string) &&
      filledNum(tenant.size),
    contact: filledStr(tenant.phone) && filledStr(tenant.email) && filledStr(tenant.officeAddress),
    branding: filledStr(tenant.logoSquareSrc) || filledStr(tenant.logoRectangleSrc),
    web: filledStr(tenant.website) && filledStr(tenant.linkedIn),
    missionVision: filledStr(tenant.missionStatement) && filledStr(tenant.visionStatement),
    offerings: filledStr(tenant.coreProducts) && filledStr(tenant.coreServices),
    values: filledArr(tenant.values),
  };

  const { percentage, completeSections } = computeCompletion(
    TENANT_COMPLETION_SECTIONS.map((s) => ({ key: s.key, weight: s.weight, complete: Boolean(complete[s.key]) }))
  );

  const computedAt = new Date();
  const completion: StoredCompletion = { percentage, completeSections, computedAt };
  await Tenant.updateOne({ _id: tenant._id }, { $set: { completion } });

  return completion;
};
