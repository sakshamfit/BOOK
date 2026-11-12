/**
 * Node/Vercel stand-in for Cloudflare's `cloudflare:workers` module.
 *
 * `next.config.ts` aliases `cloudflare:workers` to this file for the Next.js
 * (Vercel) build. The Cloudflare Workers build resolves the real module, so
 * `env` keeps exposing D1/service bindings there. On Vercel `env` is just
 * `process.env`, which means `env.DB` is absent; the store API then serves the
 * built-in demonstration catalog instead of D1-backed data.
 */
export const env = process.env as unknown as Record<string, unknown>;
