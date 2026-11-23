import assert from "assert";
import crypto from "crypto";
import jwt from "jsonwebtoken";

export const hashToken = (token: string) => crypto.createHash("sha256").update(token).digest("hex");

// read from the token itself so the TTL matches whatever expiry it was signed with
export const sessionExpiry = (refreshToken: string): Date => {
  const decoded = jwt.decode(refreshToken);
  const exp = decoded && typeof decoded === "object" ? decoded.exp : undefined;
  if (typeof exp !== "number") throw new Error("Refresh token has no exp claim.");
  return new Date(exp * 1000);
};

// Run with: pnpm --filter @rl/backend exec ts-node src/v1/modules/token/session-token.ts
const demo = () => {
  const a = jwt.sign({ id: "user" }, "demo-secret", { expiresIn: 3600 });
  const b = jwt.sign({ id: "other" }, "demo-secret", { expiresIn: 3600 });

  assert(hashToken(a) === hashToken(a), "hash is stable");
  assert(hashToken(a) !== hashToken(b), "different tokens hash differently");
  assert(/^[0-9a-f]{64}$/.test(hashToken(a)), "hash is 64 hex chars");
  assert(!hashToken(a).includes(a), "hash does not contain the token");

  const { exp } = jwt.decode(a) as { exp: number };
  assert(sessionExpiry(a).getTime() === exp * 1000, "expiry comes from the exp claim");

  const noExp = jwt.sign({ id: "user" }, "demo-secret");
  assert.throws(() => sessionExpiry(noExp), "a token without exp is rejected");
  assert.throws(() => sessionExpiry("not-a-jwt"), "garbage is rejected");

  console.log("session token self-check ok");
};

if (require.main === module) demo();
