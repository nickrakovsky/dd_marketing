import { DurableObject } from 'cloudflare:workers';
import { handleNotification, purgeLiveDeployment, singleFlight } from './core.mjs';

export class ApexPurgeCoordinator extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.coordinate = singleFlight(async () => {
      const result = await purgeLiveDeployment(env, ctx.storage);
      if (result.purged) console.log(`Purged datadocks.com for production deployment ${result.deployment}`);
      return result;
    });
  }

  async fetch() {
    try {
      const result = await this.coordinate();
      return Response.json(result);
    } catch {
      console.error('Production cache verification or purge failed; no token or API response body logged');
      return Response.json({ error: 'Production verification or purge failed' }, { status: 502 });
    }
  }
}

export default {
  fetch(request, env) {
    return handleNotification(request, env, async () => {
      const id = env.PURGE_COORDINATOR.idFromName('datadocks.com');
      const response = await env.PURGE_COORDINATOR.get(id).fetch('https://coordinator/purge', { method: 'POST' });
      if (!response.ok) throw new Error('Coordinator failed');
      return response.json();
    });
  },
};
