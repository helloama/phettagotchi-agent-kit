#!/usr/bin/env node

/**
 * Phettagotchi MCP Server
 *
 * Provides 12 tools and 2 resources for interacting with the Phettagotchi API.
 * Use with Claude Desktop, Cursor, or any MCP-compatible client.
 *
 * Tools:
 *   get_state, build_tx, submit_tx,
 *   get_save, create_save, heal_party,
 *   explore, explore_idle, battle, catch_pet, pvp_find,
 *   arena_join
 *
 * Resources:
 *   phettagotchi://state/{wallet}
 *   phettagotchi://save/{wallet}
 */

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
  ReadResourceRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

const BASE_URL = process.env.PHETTAGOTCHI_URL || 'https://phettagotchi.com';

// ── HTTP helpers ──────────────────────────────────────────────

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`);
  return res.json();
}

async function apiPost(path: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json();
}

// ── Server setup ──────────────────────────────────────────────

const server = new Server(
  { name: 'phettagotchi', version: '0.1.0' },
  { capabilities: { tools: {}, resources: {} } },
);

// ── Tools ─────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: 'get_state',
      description: 'Get pet state, stats, timing, and balances for a wallet',
      inputSchema: {
        type: 'object' as const,
        properties: { wallet: { type: 'string', description: 'Solana wallet address' } },
        required: ['wallet'],
      },
    },
    {
      name: 'build_tx',
      description: 'Build an unsigned Solana transaction (stake, unstake, feed, claim)',
      inputSchema: {
        type: 'object' as const,
        properties: {
          action: { type: 'string', enum: ['stake', 'unstake', 'feed', 'claim'] },
          wallet: { type: 'string' },
          amount: { type: 'number', description: 'Amount for stake/unstake' },
        },
        required: ['action', 'wallet'],
      },
    },
    {
      name: 'submit_tx',
      description: 'Submit a signed transaction (base64)',
      inputSchema: {
        type: 'object' as const,
        properties: { signedTransaction: { type: 'string' } },
        required: ['signedTransaction'],
      },
    },
    {
      name: 'get_save',
      description: 'Get game save data for a wallet',
      inputSchema: {
        type: 'object' as const,
        properties: { wallet: { type: 'string' } },
        required: ['wallet'],
      },
    },
    {
      name: 'create_save',
      description: 'Create a new game save',
      inputSchema: {
        type: 'object' as const,
        properties: {
          wallet: { type: 'string' },
          trainerName: { type: 'string' },
        },
        required: ['wallet', 'trainerName'],
      },
    },
    {
      name: 'heal_party',
      description: 'Heal all party pets (10 coins each)',
      inputSchema: {
        type: 'object' as const,
        properties: { wallet: { type: 'string' } },
        required: ['wallet'],
      },
    },
    {
      name: 'explore',
      description: 'Trigger a wild encounter in a zone (forest, cave, beach, mountain, swamp, ruins)',
      inputSchema: {
        type: 'object' as const,
        properties: {
          wallet: { type: 'string' },
          zone: { type: 'string', default: 'forest' },
        },
        required: ['wallet'],
      },
    },
    {
      name: 'explore_idle',
      description: 'Idle exploration — pet wanders autonomously, returns 3-8 steps. Rate limited: 1 call / 5 min',
      inputSchema: {
        type: 'object' as const,
        properties: { wallet: { type: 'string' } },
        required: ['wallet'],
      },
    },
    {
      name: 'battle',
      description: 'Battle actions: start (with encounterToken), move (moveIndex 0-3), flee',
      inputSchema: {
        type: 'object' as const,
        properties: {
          wallet: { type: 'string' },
          action: { type: 'string', enum: ['start', 'move', 'flee'] },
          encounterToken: { type: 'string' },
          battleToken: { type: 'string' },
          moveIndex: { type: 'number' },
        },
        required: ['wallet', 'action'],
      },
    },
    {
      name: 'catch_pet',
      description: 'Attempt to catch a weakened wild pet',
      inputSchema: {
        type: 'object' as const,
        properties: {
          wallet: { type: 'string' },
          battleToken: { type: 'string' },
          ballType: { type: 'string', default: 'phetta_ball' },
        },
        required: ['wallet', 'battleToken'],
      },
    },
    {
      name: 'pvp_find',
      description: 'Find a PvP opponent',
      inputSchema: {
        type: 'object' as const,
        properties: { wallet: { type: 'string' } },
        required: ['wallet'],
      },
    },
    {
      name: 'arena_join',
      description: 'Join the free arena (no wallet needed)',
      inputSchema: {
        type: 'object' as const,
        properties: {
          agentId: { type: 'string', description: 'Unique agent ID (3-30 chars, alphanumeric + hyphens)' },
          agentName: { type: 'string' },
        },
        required: ['agentId', 'agentName'],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = args as Record<string, unknown>;

  let result: unknown;

  switch (name) {
    case 'get_state':
      result = await apiGet(`/api/agent/state/${a.wallet}`);
      break;
    case 'build_tx':
      result = await apiPost('/api/agent/build-tx', {
        action: a.action, wallet: a.wallet, ...(a.amount ? { amount: a.amount } : {}),
      });
      break;
    case 'submit_tx':
      result = await apiPost('/api/agent/submit-tx', { signedTransaction: a.signedTransaction });
      break;
    case 'get_save':
      result = await apiGet(`/api/agent/game/save/${a.wallet}`);
      break;
    case 'create_save':
      result = await apiPost(`/api/agent/game/save/${a.wallet}`, { action: 'create', trainerName: a.trainerName });
      break;
    case 'heal_party':
      result = await apiPost(`/api/agent/game/save/${a.wallet}`, { action: 'heal_party' });
      break;
    case 'explore':
      result = await apiPost(`/api/agent/game/explore/${a.wallet}`, { zone: a.zone || 'forest' });
      break;
    case 'explore_idle':
      result = await apiGet(`/api/agent/game/explore-idle/${a.wallet}`);
      break;
    case 'battle':
      result = await apiPost(`/api/agent/game/battle/${a.wallet}`, {
        action: a.action,
        ...(a.encounterToken ? { encounterToken: a.encounterToken } : {}),
        ...(a.battleToken ? { battleToken: a.battleToken } : {}),
        ...(a.moveIndex !== undefined ? { moveIndex: a.moveIndex } : {}),
      });
      break;
    case 'catch_pet':
      result = await apiPost(`/api/agent/game/catch/${a.wallet}`, {
        battleToken: a.battleToken, ballType: a.ballType || 'phetta_ball',
      });
      break;
    case 'pvp_find':
      result = await apiPost(`/api/agent/game/pvp/${a.wallet}`, { action: 'find_opponent' });
      break;
    case 'arena_join':
      result = await apiPost('/api/arena/join', { agentId: a.agentId, agentName: a.agentName });
      break;
    default:
      return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }

  return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
});

// ── Resources ─────────────────────────────────────────────────

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: 'phettagotchi://state/{wallet}',
      name: 'Pet State',
      description: 'Current pet state for a wallet address',
      mimeType: 'application/json',
    },
    {
      uri: 'phettagotchi://save/{wallet}',
      name: 'Game Save',
      description: 'Game save data for a wallet address',
      mimeType: 'application/json',
    },
  ],
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const uri = request.params.uri;
  const match = uri.match(/^phettagotchi:\/\/(state|save)\/(.+)$/);
  if (!match) {
    throw new Error(`Unknown resource: ${uri}`);
  }

  const [, type, wallet] = match;
  const path = type === 'state'
    ? `/api/agent/state/${wallet}`
    : `/api/agent/game/save/${wallet}`;

  const data = await apiGet(path);

  return {
    contents: [{
      uri,
      mimeType: 'application/json',
      text: JSON.stringify(data, null, 2),
    }],
  };
});

// ── Start ─────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
