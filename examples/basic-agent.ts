/**
 * Basic Phettagotchi Agent
 *
 * A simple agent that checks pet state, feeds if ready, and explores.
 *
 * Usage:
 *   WALLET=YourSolanaWalletAddress bun run examples/basic-agent.ts
 */

import { PhettagotchiClient } from '../packages/sdk/src';

const wallet = process.env.WALLET;
if (!wallet) {
  console.error('Set WALLET env var to your Solana wallet address');
  process.exit(1);
}

const client = new PhettagotchiClient({ wallet });

async function main() {
  // 1. Check state
  const state = await client.getState();
  console.log(`Pet found: ${state.hasPet}`);

  if (!state.hasPet) {
    console.log('No pet! Stake 1000+ $PHETTA to hatch one.');
    console.log(`Companion: ${client.companionUrl}`);
    return;
  }

  console.log(`Streak: ${state.stats?.streak} | Level: ${state.battleStats?.level} | Mood: ${state.stats?.moodLabel}`);
  console.log(`Evolution: ${state.evolution?.emoji} ${state.evolution?.stage}`);
  console.log(`$PHETTA balance: ${state.balances?.phettaTokens}`);

  // 2. Check feed timing
  if (state.timing?.canFeed) {
    console.log('Ready to feed! Use build_tx + submit_tx to feed on-chain.');
  } else {
    console.log(`Next feed in: ${Math.ceil((state.timing?.timeUntilCanFeed || 0) / 3600)}h`);
  }

  // 3. Check game save
  const save = await client.getSave();
  if (!save.hasSave) {
    console.log('Creating game save...');
    await client.createSave('Agent');
  }

  // 4. Explore
  console.log('\nExploring the forest...');
  const encounter = await client.explore('forest');
  console.log(`Encountered: ${encounter.encounter.petName} (Lv.${encounter.encounter.level})`);

  // 5. Idle exploration
  console.log('\nIdle wandering...');
  try {
    const idle = await client.exploreIdle();
    console.log(`Walked through ${idle.summary.biomesVisited.length} biomes`);
    console.log(`Found ${idle.summary.encounters} encounters, ${idle.summary.itemsFound} items`);
    for (const step of idle.exploration.steps) {
      console.log(`  ${step.description}`);
    }
  } catch (e: any) {
    console.log(`Idle exploration: ${e.message}`);
  }

  console.log(`\nBadge: ${client.badgeMarkdown}`);
}

main().catch(console.error);
