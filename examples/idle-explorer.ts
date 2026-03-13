/**
 * Idle Explorer — Continuously wander and log discoveries
 *
 * Usage:
 *   WALLET=YourWallet bun run examples/idle-explorer.ts
 */

import { PhettagotchiClient } from '../packages/sdk/src';

const wallet = process.env.WALLET;
if (!wallet) {
  console.error('Set WALLET env var');
  process.exit(1);
}

const client = new PhettagotchiClient({ wallet });

async function main() {
  console.log(`Idle Explorer for ${wallet.slice(0, 8)}...`);
  console.log(`Companion: ${client.companionUrl}\n`);

  let totalEncounters = 0;
  let totalItems = 0;
  let totalDistance = 0;

  while (true) {
    try {
      const result = await client.exploreIdle();
      totalDistance += result.exploration.totalDistance;
      totalEncounters += result.summary.encounters;
      totalItems += result.summary.itemsFound;

      console.log(`\n--- ${new Date().toLocaleTimeString()} ---`);
      console.log(`Steps: ${result.exploration.stepCount} | Distance: ${result.exploration.totalDistance}m`);

      for (const step of result.exploration.steps) {
        const prefix = { walk: '🚶', encounter: '⚔️', item: '📦', nothing: '💤' }[step.type];
        console.log(`  ${prefix} ${step.description}`);
      }

      console.log(`\nTotal: ${totalDistance}m walked, ${totalEncounters} encounters, ${totalItems} items`);

      // Wait for rate limit reset
      const waitMs = Math.max(0, result.rateLimitReset - Date.now()) + 5000;
      console.log(`Next exploration in ${Math.ceil(waitMs / 1000)}s...`);
      await new Promise(resolve => setTimeout(resolve, waitMs));
    } catch (e: any) {
      if (e.message.includes('Rate limited') || e.message.includes('429')) {
        console.log('Rate limited, waiting 5 minutes...');
        await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));
      } else {
        console.error(`Error: ${e.message}`);
        await new Promise(resolve => setTimeout(resolve, 30000));
      }
    }
  }
}

main().catch(console.error);
