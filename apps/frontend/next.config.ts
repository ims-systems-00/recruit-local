import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  /* config options here */

  // Emit a self-contained server with only the traced dependencies, so the Docker
  // runtime stage does not need the full workspace node_modules.
  output: 'standalone',

  // Trace from the monorepo root: the app depends on the pnpm-symlinked @rl/types
  // and @rl/authz, which tracing from apps/frontend/ alone would miss.
  outputFileTracingRoot: path.join(import.meta.dirname, '../../'),

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
