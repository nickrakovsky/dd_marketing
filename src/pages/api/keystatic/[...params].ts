import { makeHandler } from '@keystatic/astro/api';
import type { APIContext } from 'astro';

const baseHandler = makeHandler();

export const ALL = async (ctx: APIContext) => {
  const env = (ctx.locals as any)?.runtime?.env ?? {};

  // If env vars aren't in runtime.env, try process.env
  const clientId = env.KEYSTATIC_GITHUB_CLIENT_ID || process.env.KEYSTATIC_GITHUB_CLIENT_ID;
  const clientSecret = env.KEYSTATIC_GITHUB_CLIENT_SECRET || process.env.KEYSTATIC_GITHUB_CLIENT_SECRET;
  const secret = env.KEYSTATIC_SECRET || process.env.KEYSTATIC_SECRET;

  if (!clientId) {
    return new Response(
      JSON.stringify({
        error: 'KEYSTATIC_GITHUB_CLIENT_ID not found',
        hasRuntime: !!(ctx.locals as any)?.runtime,
        hasEnv: !!(ctx.locals as any)?.runtime?.env,
        localKeys: Object.keys(ctx.locals || {}),
      }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }

  // Inject env vars into the context so Keystatic can find them
  (ctx.locals as any).runtime = {
    ...(ctx.locals as any)?.runtime,
    env: {
      ...(ctx.locals as any)?.runtime?.env,
      KEYSTATIC_GITHUB_CLIENT_ID: clientId,
      KEYSTATIC_GITHUB_CLIENT_SECRET: clientSecret,
      KEYSTATIC_SECRET: secret,
    },
  };

  return baseHandler(ctx);
};

export const prerender = false;
