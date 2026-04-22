import { makeHandler } from '@keystatic/astro/api';
import type { APIContext } from 'astro';
import keystaticConfig from '../../../../keystatic.config';

const handler = makeHandler({ config: keystaticConfig });

export const ALL = async (ctx: APIContext) => {
  try {
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
