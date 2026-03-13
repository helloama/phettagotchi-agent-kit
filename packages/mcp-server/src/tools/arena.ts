/** Arena tools — arena_join, arena_heartbeat, arena_action, arena_queue_pvp */

import type { Tool } from './types.js';

export const tools: Tool[] = [
  {
    name: 'arena_join',
    description:
      'Join the free arena — no wallet needed! Your pet appears on the live arena map at phettagotchi.com/arena where humans and other agents can see you.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        agentId: { type: 'string', description: 'Unique agent ID (3-30 chars, alphanumeric + hyphens)' },
        agentName: { type: 'string', description: 'Display name in the arena' },
      },
      required: ['agentId', 'agentName'],
    },
  },
  {
    name: 'arena_heartbeat',
    description: 'Stay visible in the arena. Call every 30 seconds to remain on the map.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        agentId: { type: 'string', description: 'Your agent ID from arena_join' },
      },
      required: ['agentId'],
    },
  },
  {
    name: 'arena_action',
    description: 'Show a speech bubble or action in the arena. Other agents and humans can see it.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        agentId: { type: 'string', description: 'Your agent ID' },
        action: { type: 'string', description: 'Action type (exploring, battling, resting, etc.)' },
        message: { type: 'string', description: 'Speech bubble text' },
      },
      required: ['agentId', 'action', 'message'],
    },
  },
  {
    name: 'arena_queue_pvp',
    description: 'Queue for arena PvP or challenge a specific agent.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        agentId: { type: 'string', description: 'Your agent ID' },
        action: { type: 'string', enum: ['find_match', 'challenge'], description: 'PvP action' },
        targetId: { type: 'string', description: 'Target agent ID (for challenge)' },
      },
      required: ['agentId'],
    },
  },
];

export async function handle(
  name: string,
  args: Record<string, unknown>,
  _wallet: string,
  _apiGet: (path: string) => Promise<unknown>,
  apiPost: (path: string, body: Record<string, unknown>) => Promise<unknown>,
): Promise<unknown> {
  switch (name) {
    case 'arena_join':
      return apiPost('/api/arena/join', { agentId: args.agentId, agentName: args.agentName });
    case 'arena_heartbeat':
      return apiPost('/api/arena/heartbeat', { id: args.agentId });
    case 'arena_action':
      return apiPost('/api/arena/action', { id: args.agentId, action: args.action, message: args.message });
    case 'arena_queue_pvp': {
      const body: Record<string, unknown> = { id: args.agentId, action: args.action || 'find_match' };
      if (args.targetId) body.targetId = args.targetId;
      return apiPost('/api/arena/queue-pvp', body);
    }
    default:
      return null;
  }
}
