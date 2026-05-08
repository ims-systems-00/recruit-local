import { redisConnection } from "../../../.config/ioredis";

export const readUserFeed = async (userId: string, page = 1, perPage = 20) => {
  const start = (page - 1) * perPage;
  const stop = start + perPage - 1;
  const members = await redisConnection.zrevrange(`feed:${userId}`, start, stop);
  return members.map((m) => JSON.parse(m)); // { jobId, snapshot }
};
