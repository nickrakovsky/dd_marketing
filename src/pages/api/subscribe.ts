export const prerender = false;
import type { APIRoute } from "astro";

const PUB_KEY = import.meta.env.PUBLIC_BENTO_KEY;
const SECRET_KEY = import.meta.env.SECRET_BENTO_KEY;
const SITE_UUID = import.meta.env.PUBLIC_BENTO_SITE_UUID;

export const POST: APIRoute = async ({ request }) => {
  if (!PUB_KEY || !SECRET_KEY || !SITE_UUID) {
    return new Response(JSON.stringify({ message: "Server Config Error" }), { status: 500 });
  }

  try {
    const body = await request.json();
    
    // AUTH: Base64 encode "PublishableKey:SecretKey"
    const authString = btoa(`${PUB_KEY}:${SECRET_KEY}`);

    console.log(`[Bento] Triggering 'Demo Subscriber' for ${body.email}...`);

    const response = await fetch(
      `https://app.bentonow.com/api/v1/batch/events?site_uuid=${SITE_UUID}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Basic ${authString}`,
          "User-Agent": "DataDocks-App/1.0"
        },
        body: JSON.stringify({
          events: [
            {
              // 1. MATCH EXISTING DATA: Use the exact event name your system expects
              type: "Demo Subscriber", 
              email: body.email,
              
              // 2. ADD METADATA: Keep this! It helps distinguish this API source 
              // from other API integrations without affecting deliverability.
              fields: {
                source: "Astro Server Island" 
              }
            }
          ]
        })
      }
    );

    const resultText = await response.text();
    console.log("[Bento] Response:", response.status, resultText);

    if (!response.ok) {
      return new Response(resultText, { status: response.status });
    }

    return new Response(
      JSON.stringify({ message: "Success" }),
      { status: 200 }
    );

  } catch (error) {
    console.error("[Bento] Error:", error);
    return new Response(JSON.stringify({ message: "Server Error" }), { status: 500 });
  }
};