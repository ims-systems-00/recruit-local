const FORWARDED_HEADERS = ['x-forwarded-for', 'x-real-ip'] as const;

export type HeaderSource = Pick<Headers, 'get'>;

// keep the user's ip, not ours
export const forwardedHeaders = (incoming: HeaderSource) => {
  const out: Record<string, string> = {};
  for (const name of FORWARDED_HEADERS) {
    const value = incoming.get(name);
    if (value) out[name] = value;
  }
  return out;
};
