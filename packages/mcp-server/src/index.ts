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
} from '@modelcontextprotocol/sdk/types.js';

// Tool modules
import * as petCare from './tools/pet-care.js';
import * as explore from './tools/explore.js';
import * as battle from './tools/battle.js';
import * as companion from './tools/companion.js';
import * as arena from './tools/arena.js';
import * as transactions from './tools/transactions.js';

const BASE_URL = process.env.PHETTAGOTCHI_URL || 'https://phettagotchi.com';

// ── Auto-wallet ──────────────────────────────────────────────

function getWallet(): string {
  // 1. Explicit env var
  if (process.env.PHETTAGOTCHI_WALLET) {
    return process.env.PHETTAGOTCHI_WALLET;
  }

  // 2. Auto-generate from ~/.phettagotchi/keypair.json
  try {
    const os = require('os');
    const path = require('path');
    const fs = require('fs');

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
  } catch {
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
  { capabilities: { tools: {}, resources: {} } },
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
