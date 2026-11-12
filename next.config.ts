import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The app is authored for Cloudflare Workers (Vinext + D1), where the
  // runtime provides `cloudflare:workers`. When Vercel builds the same source
  // with Next.js, point that import at a small `process.env` shim so the
  // storefront and its API route can be bundled and served.
  turbopack: {
    resolveAlias: {
      "cloudflare:workers": "./lib/vercel-env.ts",
    },
  },
};

export default nextConfig;
