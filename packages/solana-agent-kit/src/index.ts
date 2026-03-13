/**
 * Phettagotchi plugin for Solana Agent Kit v2
 *
 * Register this plugin with your SolanaAgentKit instance:
 *
 *   import { phettagotchiPlugin } from '@phettagotchi/solana-agent-kit';
 *   agent.use(phettagotchiPlugin);
 */

import { PhettagotchiClient } from '@phetta/sdk';

export interface PhettagotchiPluginConfig {
  baseUrl?: string;
}

/**
 * Creates a Phettagotchi plugin for Solana Agent Kit.
 *
 * Provides actions: phettagotchi_state, phettagotchi_explore,
 * phettagotchi_explore_idle, phettagotchi_battle, phettagotchi_catch,
 * phettagotchi_pvp, phettagotchi_arena_join
 */
export function createPhettagotchiPlugin(config?: PhettagotchiPluginConfig) {
  return {
    name: 'phettagotchi',
    actions: [
      {
        name: 'phettagotchi_state',
        description: 'Get Phettagotchi pet state for a wallet',
        handler: async (agent: { wallet_address: string }) => {
          const client = new PhettagotchiClient({
            wallet: agent.wallet_address,
            baseUrl: config?.baseUrl,
          });
          return client.getState();
        },
      },
      {
        name: 'phettagotchi_explore',
        description: 'Trigger a wild encounter in a zone',
        handler: async (agent: { wallet_address: string }, params: { zone?: string }) => {
          const client = new PhettagotchiClient({
            wallet: agent.wallet_address,
            baseUrl: config?.baseUrl,
          });
          return client.explore(params.zone);
        },
      },
      {
        name: 'phettagotchi_explore_idle',
        description: 'Idle exploration — pet wanders autonomously (rate limited: 5 min)',
        handler: async (agent: { wallet_address: string }) => {
          const client = new PhettagotchiClient({
            wallet: agent.wallet_address,
            baseUrl: config?.baseUrl,
          });
          return client.exploreIdle();
        },
      },
      {
        name: 'phettagotchi_battle',
        description: 'Battle a wild pet (start, move, flee)',
        handler: async (
          agent: { wallet_address: string },
          params: { action: string; encounterToken?: string; battleToken?: string; moveIndex?: number },
        ) => {
          const client = new PhettagotchiClient({
            wallet: agent.wallet_address,
            baseUrl: config?.baseUrl,
          });
          if (params.action === 'start' && params.encounterToken) {
            return client.battleStart(params.encounterToken);
          }
          if (params.action === 'move' && params.battleToken) {
            return client.battleMove(params.battleToken, params.moveIndex ?? 0);
          }
          if (params.action === 'flee' && params.battleToken) {
            return client.battleFlee(params.battleToken);
          }
          throw new Error('Invalid battle params');
        },
      },
      {
        name: 'phettagotchi_catch',
        description: 'Catch a weakened wild pet',
        handler: async (
          agent: { wallet_address: string },
          params: { battleToken: string; ballType?: string },
        ) => {
          const client = new PhettagotchiClient({
            wallet: agent.wallet_address,
            baseUrl: config?.baseUrl,
          });
          return client.catch(params.battleToken, params.ballType);
        },
      },
      {
        name: 'phettagotchi_pvp',
        description: 'Find a PvP opponent',
        handler: async (agent: { wallet_address: string }) => {
          const client = new PhettagotchiClient({
            wallet: agent.wallet_address,
            baseUrl: config?.baseUrl,
          });
          return client.pvpFind();
        },
      },
      {
        name: 'phettagotchi_arena_join',
        description: 'Join the free Phettagotchi arena',
        handler: async (
          _agent: { wallet_address: string },
          params: { agentId: string; agentName: string },
        ) => {
          const client = new PhettagotchiClient({
            wallet: '11111111111111111111111111111111',
            baseUrl: config?.baseUrl,
          });
          return client.arenaJoin(params.agentId, params.agentName);
        },
      },
    ],
  };
}

export const phettagotchiPlugin = createPhettagotchiPlugin();
