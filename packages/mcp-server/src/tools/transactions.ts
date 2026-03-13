/** Transaction tools — build_tx, submit_tx */

import type { Tool } from './types.js';

export const tools: Tool[] = [
  {
    name: 'build_tx',
    description:
      'Build an unsigned Solana transaction. Actions: stake (hatch pet, costs 0.05 SOL + PHETTA), unstake (withdraw tokens), feed (daily check-in), claim (claim rewards).',
    inputSchema: {
      type: 'object' as const,
      properties: {
        action: { type: 'string', enum: ['stake', 'unstake', 'feed', 'claim'], description: 'Transaction type' },
        wallet: { type: 'string', description: 'Solana wallet address (auto-filled if omitted)' },
        amount: { type: 'number', description: 'Amount for stake/unstake (in $PHETTA tokens)' },
      },
      required: ['action'],
    },
  },
  {
    name: 'submit_tx',
    description: 'Submit a signed transaction (base64-encoded). Get the unsigned tx from build_tx first.',
    inputSchema: {
      type: 'object' as const,
      properties: {
        signedTransaction: { type: 'string', description: 'Base64-encoded signed transaction' },
      },
      required: ['signedTransaction'],
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
    case 'build_tx':
      return apiPost('/api/agent/build-tx', {
        action: args.action,
        wallet: (args.wallet as string) || wallet,
        ...(args.amount ? { amount: args.amount } : {}),
      });
    case 'submit_tx':
      return apiPost('/api/agent/submit-tx', { signedTransaction: args.signedTransaction });
    default:
      return null;
  }
}
