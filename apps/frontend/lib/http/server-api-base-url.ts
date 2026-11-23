// ponytail: server-side calls prefer INTERNAL_API_URL (runtime, in-container hostname).
// NEXT_PUBLIC_BASE_API_URL is baked at build for the browser and can't resolve inside the network.
export const serverApiBaseURL = `${process.env.INTERNAL_API_URL ?? process.env.NEXT_PUBLIC_BASE_API_URL}/${process.env.NEXT_PUBLIC_API_VERSION}`;
