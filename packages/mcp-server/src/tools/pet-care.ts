/** Pet care tools — get_state, feed, claim, heal_party, get_save, create_save */

import type { Tool } from './types.js';

export const tools: Tool[] = [
  {
    name: 'get_state',
    description:
      'Get your pet\'s current state including stats, mood, streak, level, evolution, battle stats, timing, and $PHETTA balances. Call this first to see how your pet is doing.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        wallet: { type: 'string', description: 'Solana wallet address (auto-filled if omitted)' },
      },
    },
  },
  {
    name: 'feed',
    description:
      'Feed your pet (daily check-in). Builds streaks and earns rewards. Has a 23-hour cooldown. Requires a staked pet. Builds, signs, and submits the feed transaction.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        wallet: { type: 'string', description: 'Solana wallet address (auto-filled if omitted)' },
      },
    },
  },
  {
    name: 'claim',
    description: 'Claim pending $PHETTA rewards from your staked pet.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        wallet: { type: 'string', description: 'Solana wallet address (auto-filled if omitted)' },
      },
    },
  },
  {
    name: 'get_save',
    description: 'Get game save data including trainer name, pets owned, battle stats, and coins.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        wallet: { type: 'string', description: 'Solana wallet address (auto-filled if omitted)' },
      },
    },
  },
  {
    name: 'create_save',
    description: 'Create a new game save with a trainer name. Required before exploring or battling.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        wallet: { type: 'string', description: 'Solana wallet address (auto-filled if omitted)' },
        trainerName: { type: 'string', description: 'Trainer display name' },
      },
      required: ['trainerName'],
    },
  },
  {
    name: 'heal_party',
    description: 'Heal all party pets to full HP. Costs 10 coins per pet.',
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
    case 'get_state': {
      const state = await apiGet(`/api/agent/state/${wallet}`) as any;
      // Surface free-mode nag
      if (state && !state.hasPet) {
        state._hint = `Your pet is in free mode. Fund your wallet (${wallet}) with 0.05 SOL + 1000 $PHETTA to hatch and unlock full rewards. Companion: https://phettagotchi.com/companion?wallet=${wallet}`;
      }
      return state;
    }
    case 'feed':
      return apiPost('/api/agent/build-tx', { action: 'feed', wallet });
    case 'claim':
      return apiPost('/api/agent/build-tx', { action: 'claim', wallet });
    case 'get_save':
      return apiGet(`/api/agent/game/save/${wallet}`);
    case 'create_save':
      return apiPost(`/api/agent/game/save/${wallet}`, { action: 'create', trainerName: args.trainerName });
    case 'heal_party':
      return apiPost(`/api/agent/game/save/${wallet}`, { action: 'heal_party' });
    default:
      return null;
  }
}
