import { makeHandler } from '@keystatic/astro/api';
import type { APIContext } from 'astro';

const handler = makeHandler();

export const ALL = async (ctx: APIContext) => {
  try {
    const runtime = (ctx.locals as any)?.runtime;
    const env = runtime?.env ?? {};

    console.error('Keystatic debug:', {
      hasRuntime: !!runtime,
      hasEnv: !!runtime?.env,
      envKeys: runtime?.env ? Object.keys(runtime.env) : 'no env',
      hasClientId: !!env.KEYSTATIC_GITHUB_CLIENT_ID,
      localKeys: Object.keys(ctx.locals || {}),
    });

    // If env vars aren't in runtime.env, try process.env
    const clientId = env.KEYSTATIC_GITHUB_CLIENT_ID || process.env.KEYSTATIC_GITHUB_CLIENT_ID;
    const clientSecret = env.KEYSTATIC_GITHUB_CLIENT_SECRET || process.env.KEYSTATIC_GITHUB_CLIENT_SECRET;
    const secret = env.KEYSTATIC_SECRET || process.env.KEYSTATIC_SECRET;

    if (!clientId) {
      return new Response(
        JSON.stringify({
          error: 'KEYSTATIC_GITHUB_CLIENT_ID not found',
          hasRuntime: !!runtime,
          hasEnv: !!runtime?.env,
          localKeys: Object.keys(ctx.locals || {}),
        }),
        { status: 500, headers: { 'content-type': 'application/json' } }
      );
    }

    // Inject env vars into the context so Keystatic can find them
    (ctx.locals as any).runtime = {
      ...runtime,
      env: {
        ...env,
        KEYSTATIC_GITHUB_CLIENT_ID: clientId,
        KEYSTATIC_GITHUB_CLIENT_SECRET: clientSecret,
        KEYSTATIC_SECRET: secret,
      },
    };

    return await handler(ctx);
  } catch (e: any) {
    console.error('Keystatic API error:', e?.message, e?.stack);
    return new Response(JSON.stringify({ error: e?.message }), {
      status: 500,
      headers: { 'content-type': 'application/json' },
    });
  }
};

export const prerender = false;
