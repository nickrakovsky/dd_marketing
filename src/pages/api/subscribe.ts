export const prerender = false;

import type { APIRoute } from "astro";
import { Analytics } from "@bentonow/bento-node-sdk";

export const POST: APIRoute = async ({ request }) => {
  try {
    // 1. Read JSON (sent from the React Island)
    const body = await request.json();
    const email = body.email;

    if (!email) {
      return new Response(JSON.stringify({ message: "Email required" }), { status: 400 });
    }

    // 2. Init SDK with your verified PERSONAL key
    const bento = new Analytics({
      siteUuid: "b4cb9a34a989bcc643714151df7b7154",
      authentication: {
          secretKey: import.meta.env.BENTO_SECRET_KEY,
          publishableKey: import.meta.env.PUBLIC_BENTO_KEY
      }
    });

    // 3. Track
    await bento.V1.track({
      email: email,
      type: "Demo Subscriber",
      fields: { source: "Astro Server Island" }
    });

    // 4. Return JSON Success (React will handle the UI update)
    return new Response(JSON.stringify({ success: true }), { status: 200 });

  } catch (error) {
    console.error("Bento Server Error:", error);
    return new Response(JSON.stringify({ success: false }), { status: 500 });
  }
};