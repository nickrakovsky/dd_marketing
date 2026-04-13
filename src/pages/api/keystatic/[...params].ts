import { makeHandler } from '@keystatic/astro/api';

const handler = makeHandler();

export const ALL: typeof handler = async (ctx) => {
  try {
    const runtime = (ctx.locals as any)?.runtime;
    console.error('Keystatic debug:', {
      hasRuntime: !!runtime,
      hasEnv: !!runtime?.env,
      envKeys: runtime?.env ? Object.keys(runtime.env) : 'no env',
      hasClientId: !!runtime?.env?.KEYSTATIC_GITHUB_CLIENT_ID,
    });
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
