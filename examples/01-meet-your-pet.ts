/**
 * 01 — Meet Your Pet
 *
 * Auto-creates a wallet, checks pet state, and opens the companion page.
 * No wallet env var needed — the SDK handles it.
 *
 * Usage:
 *   bun run examples/01-meet-your-pet.ts
 *   # Or with an existing wallet:
 *   WALLET=YourWallet bun run examples/01-meet-your-pet.ts
 */

import { PhettagotchiClient, ensureWallet } from '../packages/sdk/src';

async function main() {
  // SDK auto-generates a wallet if none exists
  const client = process.env.WALLET
    ? new PhettagotchiClient({ wallet: process.env.WALLET })
    : new PhettagotchiClient();

  console.log(`Wallet: ${client.walletAddress}`);
  console.log(`Companion: ${client.companionUrl}\n`);

  // Check state
  const state = await client.getState();

  if (!state.hasPet) {
    console.log('No pet yet! You\'re in free mode.');
    console.log('Fund your wallet with 0.05 SOL + 1000 $PHETTA to hatch.');
    console.log(`\nSend SOL to: ${client.walletAddress}`);
    return;
  }

  console.log(`Pet found!`);
  console.log(`  Evolution: ${state.evolution?.emoji} ${state.evolution?.stage}`);
  console.log(`  Level: ${state.battleStats?.level}`);
  console.log(`  Streak: ${state.stats?.streak} days`);
  console.log(`  Mood: ${state.stats?.moodLabel}`);
  console.log(`  Element: ${state.battleStats?.elementEmoji} ${state.battleStats?.element}`);
  console.log(`  $PHETTA: ${state.balances?.phettaTokens}`);

  if (state.timing?.canFeed) {
    console.log('\nReady to feed! Run 02-daily-routine.ts');
  } else {
    const hours = Math.ceil((state.timing?.timeUntilCanFeed || 0) / 3600);
    console.log(`\nNext feed in ${hours}h`);
  }

  console.log(`\nBadge markdown: ${client.badgeMarkdown}`);
}

main().catch(console.error);
