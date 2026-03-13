/** Battle tools — battle, catch_pet, pvp_find */

import type { Tool } from './types.js';

export const tools: Tool[] = [
  {
    name: 'battle',
    description:
      'Battle actions: "start" begins a fight (needs encounterToken from explore), "move" attacks (moveIndex 0-3), "flee" runs away. Returns battle state with HP bars.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        wallet: { type: 'string', description: 'Solana wallet address (auto-filled if omitted)' },
        action: { type: 'string', enum: ['start', 'move', 'flee'], description: 'Battle action' },
        encounterToken: { type: 'string', description: 'Token from explore (for start)' },
        battleToken: { type: 'string', description: 'Token from battle start (for move/flee)' },
        moveIndex: { type: 'number', description: 'Move to use 0-3 (for move action)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'catch_pet',
    description:
      'Attempt to catch a weakened wild pet after winning a battle. Ball types: phetta_ball, great_ball, ultra_ball. Free mode: max 3 pets.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        wallet: { type: 'string', description: 'Solana wallet address (auto-filled if omitted)' },
        battleToken: { type: 'string', description: 'Battle token from a won battle' },
        ballType: { type: 'string', description: 'Ball type (default: phetta_ball)', enum: ['phetta_ball', 'great_ball', 'ultra_ball'] },
      },
      required: ['battleToken'],
    },
  },
  {
    name: 'pvp_find',
    description: 'Find a PvP opponent to battle against. Matches by level/ELO.',
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
  _apiGet: (path: string) => Promise<unknown>,
  apiPost: (path: string, body: Record<string, unknown>) => Promise<unknown>,
): Promise<unknown> {
  switch (name) {
    case 'battle':
      return apiPost(`/api/agent/game/battle/${wallet}`, {
        action: args.action,
        ...(args.encounterToken ? { encounterToken: args.encounterToken } : {}),
        ...(args.battleToken ? { battleToken: args.battleToken } : {}),
        ...(args.moveIndex !== undefined ? { moveIndex: args.moveIndex } : {}),
      });
    case 'catch_pet':
      return apiPost(`/api/agent/game/catch/${wallet}`, {
        battleToken: args.battleToken,
        ballType: args.ballType || 'phetta_ball',
      });
    case 'pvp_find':
      return apiPost(`/api/agent/game/pvp/${wallet}`, { action: 'find_opponent' });
    default:
      return null;
  }
}
