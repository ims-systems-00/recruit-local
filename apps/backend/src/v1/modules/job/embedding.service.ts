import { Job, Tenant } from "../../../models";
import { generateEmbedding, generateEmbeddings } from "../../../common/helper/embedding";

/**
 * Job -> the text we embed.
 *
 * The tenant name is pulled in on purpose. The old `searchFields` list included
 * "company", which is not a field on Job, so company search silently matched
 * nothing. Putting the organisation name in the embedded text is what makes a
 * search for the employer actually work.
 */
export const buildJobEmbeddingText = (
  job: { title?: string; category?: string; location?: string; description?: string; responsibility?: string },
  tenantName?: string
): string =>
  [job.title, tenantName, job.category, job.location, job.description, job.responsibility].filter(Boolean).join("\n");

const tenantNameFor = async (tenantId?: unknown): Promise<string | undefined> => {
  if (!tenantId) return undefined;
  const tenant = await Tenant.findById(tenantId).select("name").lean();
  return tenant?.name;
};

/** Recompute and store one job's embedding. Called off the request path by the queue. */
export const recomputeJobEmbedding = async (jobId: string): Promise<void> => {
  const job = await Job.findById(jobId).select("title category location description responsibility tenantId").lean();
  if (!job) return;

  const text = buildJobEmbeddingText(job, await tenantNameFor(job.tenantId));
  const embedding = await generateEmbedding(text);
  // An empty vector means the OpenAI call failed. Keep the previous embedding
  // rather than blanking a job out of semantic search.
  if (!embedding.length) return;

  await Job.updateOne({ _id: jobId }, { $set: { embedding, embeddingUpdatedAt: new Date() } });
};

/** Batch variant for the backfill — one OpenAI request per batch instead of per job. */
export const recomputeJobEmbeddingsBatch = async (jobIds: string[]): Promise<number> => {
  const jobs = await Job.find({ _id: { $in: jobIds } })
    .select("title category location description responsibility tenantId")
    .lean();
  if (!jobs.length) return 0;

  const tenantIds = [...new Set(jobs.map((job) => String(job.tenantId)).filter((id) => id && id !== "undefined"))];
  const tenants = await Tenant.find({ _id: { $in: tenantIds } })
    .select("name")
    .lean();
  const tenantNames = new Map(tenants.map((tenant) => [String(tenant._id), tenant.name]));

  const texts = jobs.map((job) => buildJobEmbeddingText(job, tenantNames.get(String(job.tenantId))));
  const embeddings = await generateEmbeddings(texts);

  const writes = jobs
    .map((job, index) => ({ job, embedding: embeddings[index] }))
    .filter(({ embedding }) => embedding?.length)
    .map(({ job, embedding }) => ({
      updateOne: {
        filter: { _id: job._id },
        update: { $set: { embedding, embeddingUpdatedAt: new Date() } },
      },
    }));

  if (!writes.length) return 0;
  await Job.bulkWrite(writes);
  return writes.length;
};
