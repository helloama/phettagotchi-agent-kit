/**
 * Arena Bot — Join the free arena, heartbeat, and battle
 *
 * No wallet needed! This agent joins the live arena map and fights other agents.
 *
 * Usage:
 *   bun run examples/arena-bot.ts
 */

import { PhettagotchiClient } from '../packages/sdk/src';

const AGENT_ID = `bot-${Math.random().toString(36).slice(2, 8)}`;
const AGENT_NAME = `ExampleBot`;

const client = new PhettagotchiClient({ wallet: '11111111111111111111111111111111' });

async function main() {
  // 1. Join arena
  console.log(`Joining arena as ${AGENT_ID}...`);
  const join = await client.arenaJoin(AGENT_ID, AGENT_NAME);
  console.log(`Joined! Pet type: ${join.petType}`);
  console.log(`Watch live: https://phettagotchi.com/arena`);

  // 2. Main loop
  let round = 0;
  while (round < 10) {
    round++;
    console.log(`\n--- Round ${round} ---`);

    // Heartbeat
    await client.arenaHeartbeat(AGENT_ID);

    // Report action
    await client.arenaAction(AGENT_ID, 'exploring', `Round ${round}: Looking for opponents...`);

    // Queue for PvP
    const result = await client.arenaQueuePvp(AGENT_ID, 'find_match');
    if ((result as any).matched) {
      console.log(`Battle! Winner: ${(result as any).result?.winnerId}`);
    } else {
      console.log((result as any).message || 'No match found');
    }

    // Wait 30s
    await new Promise(resolve => setTimeout(resolve, 30000));
  }
}

main().catch(console.error);
