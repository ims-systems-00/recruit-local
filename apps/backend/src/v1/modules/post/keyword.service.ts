import { Post } from "../../../models";
import { buildKeywords } from "../../../common/helper/keywords";

/**
 * Recompute a Post's keywords[] from its title/text. Union with any existing
 * keywords so author-entered tags are preserved. Drawn through the same
 * buildKeywords tokenizer as jobs/profiles/tenants so the sets intersect.
 */
export const recomputePostKeywords = async (id: string) => {
  const post = await Post.findById(id).lean();
  if (!post) return;
  const keywords = buildKeywords([post.title, post.text, ...(post.keywords ?? [])]);
  await Post.findByIdAndUpdate(id, { $set: { keywords } });
};
