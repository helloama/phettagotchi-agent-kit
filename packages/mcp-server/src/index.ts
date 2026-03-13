#!/usr/bin/env node

/**
 * Phettagotchi MCP Server
 *
 * Install in Claude Desktop, Cursor, or any MCP client.
 * Auto-generates a Solana wallet at ~/.phettagotchi/keypair.json on first run.
 *
 * Tools:
 *   get_state, feed, claim, get_save, create_save, heal_party,
 *   explore, explore_idle, battle, catch_pet, pvp_find,
 *   build_tx, submit_tx,
 *   get_companion_url, talk_to_pet,
 *   arena_join, arena_heartbeat, arena_action, arena_queue_pvp
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
  ListPromptsRequestSchema,
  GetPromptRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// Tool modules
import * as petCare from './tools/pet-care.js';
import * as explore from './tools/explore.js';
import * as battle from './tools/battle.js';
import * as companion from './tools/companion.js';
import * as arena from './tools/arena.js';
import * as transactions from './tools/transactions.js';

import { createRequire } from 'module';
import * as os from 'os';
import * as path from 'path';
import * as fs from 'fs';

const require = createRequire(import.meta.url);

const BASE_URL = process.env.PHETTAGOTCHI_URL || 'https://phettagotchi.com';

// ── Auto-wallet ──────────────────────────────────────────────

function getWallet(): string {
  // 1. Explicit env var
  if (process.env.PHETTAGOTCHI_WALLET) {
    return process.env.PHETTAGOTCHI_WALLET;
  }

  // 2. Auto-generate from ~/.phettagotchi/keypair.json
  try {
    const keypairPath = path.join(os.homedir(), '.phettagotchi', 'keypair.json');

    if (fs.existsSync(keypairPath)) {
      // Load existing
      const data = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
      const { Keypair } = require('@solana/web3.js');
      const kp = Keypair.fromSecretKey(Uint8Array.from(data));
      const wallet = kp.publicKey.toBase58();
      console.error(`[phettagotchi] Wallet loaded: ${wallet.slice(0, 8)}...`);
      return wallet;
    }

    // Generate new
    const { Keypair } = require('@solana/web3.js');
    const kp = Keypair.generate();
    const dir = path.join(os.homedir(), '.phettagotchi');
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(keypairPath, JSON.stringify(Array.from(kp.secretKey)), { mode: 0o600 });
    const wallet = kp.publicKey.toBase58();
    console.error(`[phettagotchi] New wallet created: ${wallet}`);
    console.error(`[phettagotchi] Keypair saved to: ${keypairPath}`);
    console.error(`[phettagotchi] Fund with 0.05 SOL + $PHETTA to hatch your pet!`);
    return wallet;
  } catch (e) {
    // Fallback: no wallet
    console.error('[phettagotchi] No wallet configured. Set PHETTAGOTCHI_WALLET or install @solana/web3.js');
    return '';
  }
}

const defaultWallet = getWallet();

// ── HTTP helpers ──────────────────────────────────────────────

async function apiGet(path: string): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((body as any).error || (body as any).message || `HTTP ${res.status}`);
  }
  return res.json();
}

async function apiPost(path: string, body: Record<string, unknown>): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error((data as any).error || (data as any).message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Collect all tools ────────────────────────────────────────

const allTools = [
  ...petCare.tools,
  ...explore.tools,
  ...battle.tools,
  ...companion.tools,
  ...arena.tools,
  ...transactions.tools,
];

const toolHandlers: Record<string, typeof petCare> = {};
for (const mod of [petCare, explore, battle, companion, arena, transactions]) {
  for (const tool of mod.tools) {
    toolHandlers[tool.name] = mod;
  }
}

// ── Server setup ──────────────────────────────────────────────

const server = new Server(
  { name: 'phettagotchi', version: '1.0.0' },
  { capabilities: { tools: {}, resources: {}, prompts: {} } },
);

// ── Tools ─────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: allTools,
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = (args || {}) as Record<string, unknown>;

  // Resolve wallet: explicit arg > default
  const wallet = (a.wallet as string) || defaultWallet;

  const handler = toolHandlers[name];
  if (!handler) {
    return { content: [{ type: 'text', text: `Unknown tool: ${name}` }], isError: true };
  }

  try {
    const result = await handler.handle(name, a, wallet, apiGet, apiPost);
    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (err: any) {
    return { content: [{ type: 'text', text: `Error: ${err.message}` }], isError: true };
  }
});

// ── Resources ─────────────────────────────────────────────────

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: [
    {
      uri: `phettagotchi://state/${defaultWallet || '{wallet}'}`,
      name: 'Pet State',
      description: 'Current pet state, stats, and balances',
      mimeType: 'application/json',
    },
    {
      uri: `phettagotchi://save/${defaultWallet || '{wallet}'}`,
      name: 'Game Save',
      description: 'Game save data with trainer, pets, and battle stats',
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

// ── Prompts (Conversation Starters) ──────────────────────────

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: [
    {
      name: 'start-playing',
      description: 'Get started with your Phettagotchi pet — set up account, explore, and see your companion page.',
    },
    {
      name: 'daily-check-in',
      description: 'Do the daily routine: check status, feed if possible, explore, and report back.',
    },
  ],
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name } = request.params;

  if (name === 'start-playing') {
    return {
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `You have Phettagotchi tools available! Here's what to do:

1. Call get_state to check if I already have a pet
2. Call create_save to set up my game account if needed
3. Call explore to find a wild pet in the world
4. If you find one, call battle with action "start" and the encounterToken, then battle with action "move" to fight
5. If you win, call catch_pet with the battleToken
6. Call get_companion_url to give me the URL to see my 3D pet
7. Call talk_to_pet to say hi

Narrate everything like a fun adventure! Tell me my companion page URL at the end so I can watch my pet.`,
        },
      }],
    };
  }

  if (name === 'daily-check-in') {
    return {
      messages: [{
        role: 'user' as const,
        content: {
          type: 'text' as const,
          text: `Do my daily Phettagotchi routine:

1. get_state — How is my pet doing?
2. feed — Feed if the timing shows canFeed is true (skip if no on-chain pet)
3. claim — Claim if pending rewards > 0
4. explore_idle — What did my pet find while wandering?
5. If there are encounters, battle the strongest one
6. talk_to_pet with a morning greeting

Give me a quick summary of everything that happened.`,
        },
      }],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});

// ── Start ─────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error(`[phettagotchi] MCP server running`);
  if (defaultWallet) {
    console.error(`[phettagotchi] Companion: https://phettagotchi.com/companion?wallet=${defaultWallet}`);
  }
}

main().catch(console.error);
