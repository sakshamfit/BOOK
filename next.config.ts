import type { NextConfig } from "next";

// Vercel sets VERCEL=1 for its builds. The Cloudflare/Vinext build reads this
// same config, so the alias below must stay out of that path: workerd provides
// the real `cloudflare:workers` module and its WorkerEntrypoint exports.
const isVercelBuild = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  ...(isVercelBuild
    ? {
        // Next.js on Vercel has no `cloudflare:workers` module. Point it at a
        // small `process.env` shim so the storefront and its API route bundle.
        turbopack: {
          resolveAlias: {
            "cloudflare:workers": "./lib/vercel-env.ts",
          },
        },
      }
    : {}),
};

export default nextConfig;
