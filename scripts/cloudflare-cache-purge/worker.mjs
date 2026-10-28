import { DurableObject } from 'cloudflare:workers';
import { handleNotification, purgeLiveDeployment, singleFlight } from './core.mjs';

export class ApexPurgeCoordinator extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.coordinate = singleFlight(async expected => {
      const result = await purgeLiveDeployment(env, ctx.storage, expected);
      if (result.purged) console.log(`Purged datadocks.com for production deployment ${result.deployment}`);
      return result;
    });
  }

  async fetch(request) {
    try {
      const result = await this.coordinate(await request.json());
      return Response.json(result);
    } catch {
      console.error('Production cache verification or purge failed; no token or API response body logged');
      return Response.json({ error: 'Production verification or purge failed' }, { status: 502 });
    }
  }
}

export default {
  fetch(request, env) {
    return handleNotification(request, env, async expected => {
      const id = env.PURGE_COORDINATOR.idFromName('datadocks.com');
      const response = await env.PURGE_COORDINATOR.get(id).fetch('https://coordinator/purge', {
        method: 'POST', body: JSON.stringify(expected), headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Coordinator failed');
      return response.json();
    });
  },
};
