import { Tenant } from "../../../models";
import { buildKeywords } from "../../../common/helper/keywords";

/**
 * Recompute a Tenant's keywords[] from its free-text company fields. Union with
 * any existing keywords so manually-entered tags are preserved. Same tokenizer
 * as jobs/profiles/posts so a post's keywords can intersect a tenant's.
 */
export const recomputeTenantKeywords = async (id: string) => {
  const tenant = await Tenant.findById(id).lean();
  if (!tenant) return;
  const keywords = buildKeywords([
    tenant.name,
    tenant.industry,
    tenant.description,
    tenant.missionStatement,
    tenant.visionStatement,
    tenant.coreProducts,
    tenant.coreServices,
    ...(tenant.keywords ?? []),
  ]);
  await Tenant.findByIdAndUpdate(id, { $set: { keywords } });
};
