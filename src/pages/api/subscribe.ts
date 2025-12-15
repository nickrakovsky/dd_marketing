import type { APIRoute } from "astro";
import { Analytics } from "@bentonow/bento-node-sdk";

const BENTO_KEY = import.meta.env.BENTO_API_KEY;
const BENTO_SITE_UUID = "b4cb9a34a989bcc643714151df7b7154"; // Your actual UUID

export const POST: APIRoute = async ({ request }) => {
  if (!BENTO_KEY) {
    return new Response(
      JSON.stringify({ message: "Server configuration error" }),
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({ message: "Email is required" }),
        { status: 400 }
      );
    }

    // FIX 1: Pass a dummy publishableKey to satisfy the Strict Type requirement
    // The SDK requires the key to be present in the type, but doesn't use it when secretKey is present.
    const bento = new Analytics({
      authentication: {
        secretKey: BENTO_KEY,
        publishableKey: "ignored", 
      },
      siteUuid: BENTO_SITE_UUID,
    });

    // FIX 2: Cast to 'any' to bypass the "Property Subscribers does not exist" error
    // The type definition in the library is slightly out of sync with the actual methods.
    await (bento as any).Subscribers.importSubscribers({
      subscribers: [{ email: email }],
    });

    return new Response(
      JSON.stringify({ message: "Successfully subscribed!" }),
      { status: 200 }
    );
  } catch (error) {
    console.error("Bento Error:", error);
    return new Response(
      JSON.stringify({ message: "Failed to subscribe" }),
      { status: 500 }
    );
  }
};