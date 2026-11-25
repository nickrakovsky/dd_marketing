import type { APIRoute } from 'astro';
import { handleBookingRequest } from '../../lib/server/demo-booking-runtime';
import type { DemoEnvironment } from '../../lib/server/demo-runtime';
export const prerender = false;
export const POST: APIRoute = ({ request, locals }) => handleBookingRequest(
  request, (locals as { runtime?: { env?: DemoEnvironment } }).runtime?.env, import.meta.env.DEV,
);
