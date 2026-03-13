/**
 * 02 — Daily Routine
 *
 * Check state, feed if ready, claim rewards, explore.
 * Run this daily to maintain your streak.
 *
 * Usage:
 *   WALLET=YourWallet bun run examples/02-daily-routine.ts
 */

import { PhettagotchiClient } from '../packages/sdk/src';

const wallet = process.env.WALLET;
if (!wallet) {
  console.error('Set WALLET env var (or run 01-meet-your-pet.ts first)');
  process.exit(1);
}

const client = new PhettagotchiClient({ wallet });

async function main() {
  console.log(`Daily routine for ${wallet!.slice(0, 8)}...`);

  // 1. Check state
  const state = await client.getState();
  if (!state.hasPet) {
    console.log('No pet! Stake 1000+ $PHETTA to hatch.');
    return;
  }

  console.log(`Streak: ${state.stats?.streak} | Level: ${state.battleStats?.level} | Mood: ${state.stats?.moodLabel}`);

  // 2. Claim pending rewards
  if (state.balances?.pendingRewards && state.balances.pendingRewards > 0) {
    console.log(`\nClaiming ${state.balances.pendingRewards} pending rewards...`);
    try {
      const claimResult = await client.signAndSubmit('claim');
      console.log(`Claimed! Tx: ${claimResult.signature}`);
    } catch (e: any) {
      console.log(`Claim: ${e.message}`);
    }
  }

  // 3. Feed if ready
  if (state.timing?.canFeed) {
    console.log('\nFeeding...');
    try {
      const feedResult = await client.signAndSubmit('feed');
      console.log(`Fed! Tx: ${feedResult.signature}`);
    } catch (e: any) {
      console.log(`Feed: ${e.message}`);
    }
  } else {
    const hours = Math.ceil((state.timing?.timeUntilCanFeed || 0) / 3600);
    console.log(`\nFeed in ${hours}h`);
  }

  // 4. Idle exploration
  console.log('\nIdle exploring...');
  try {
    const idle = await client.exploreIdle();
    for (const step of idle.exploration.steps) {
      const emoji = { walk: '>', encounter: '!', item: '*', nothing: '.' }[step.type];
      console.log(`  ${emoji} ${step.description}`);
    }
    console.log(`  ${idle.summary.encounters} encounters, ${idle.summary.itemsFound} items found`);
  } catch (e: any) {
    console.log(`  ${e.message}`);
  }

  // 5. Check post-feed state
  const updated = await client.getState();
  console.log(`\nStreak: ${updated.stats?.streak} | Multiplier: ${updated.stats?.multiplier}x`);
}

main().catch(console.error);
