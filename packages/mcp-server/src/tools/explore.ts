/** Exploration tools — explore, explore_idle */

import type { Tool } from './types.js';

export const tools: Tool[] = [
  {
    name: 'explore',
    description:
      'Explore a zone to trigger a wild encounter. Zones: forest, cave, beach, mountain, swamp, ruins. Returns an encounter with a wild pet you can battle or catch.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        wallet: { type: 'string', description: 'Solana wallet address (auto-filled if omitted)' },
        zone: { type: 'string', description: 'Zone to explore (default: forest)', enum: ['forest', 'cave', 'beach', 'mountain', 'swamp', 'ruins'] },
      },
    },
  },
  {
    name: 'explore_idle',
    description:
      'Let your pet wander autonomously. Returns 3-8 steps of exploration with encounters, items, and discoveries. Rate limited: 1 call per 5 minutes. Great for passive play.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        wallet: { type: 'string', description: 'Solana wallet address (auto-filled if omitted)' },
      },
    },
  },
];

export async function handle(
  name: string,
  args: Record<string, unknown>,
  wallet: string,
  apiGet: (path: string) => Promise<unknown>,
  apiPost: (path: string, body: Record<string, unknown>) => Promise<unknown>,
): Promise<unknown> {
  switch (name) {
    case 'explore':
      return apiPost(`/api/agent/game/explore/${wallet}`, { zone: args.zone || 'forest' });
    case 'explore_idle':
      return apiGet(`/api/agent/game/explore-idle/${wallet}`);
    default:
      return null;
  }
}
