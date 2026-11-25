import type { APIRoute } from 'astro';
import { handleDemoRequest } from '../../lib/server/demo-runtime';
import type { DemoEnvironment } from '../../lib/server/demo-runtime';

export const prerender = false;
export const POST: APIRoute = ({ request, locals }) => handleDemoRequest(
  request, (locals as { runtime?: { env?: DemoEnvironment } }).runtime?.env, import.meta.env.DEV,
);
