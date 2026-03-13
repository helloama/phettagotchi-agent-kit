/**
 * 03 — Explorer Agent
 *
 * Explore all zones, battle wild pets, try to catch them.
 *
 * Usage:
 *   WALLET=YourWallet bun run examples/03-explorer-agent.ts
 */

import { PhettagotchiClient } from '../packages/sdk/src';

const wallet = process.env.WALLET;
if (!wallet) {
  console.error('Set WALLET env var');
  process.exit(1);
}

const client = new PhettagotchiClient({ wallet });

const ZONES = ['forest', 'cave', 'beach', 'mountain', 'swamp', 'ruins'];

async function main() {
  // Ensure save exists
  const save = await client.getSave();
  if (!save.hasSave) {
    console.log('Creating save...');
    await client.createSave('Explorer');
  }

  for (const zone of ZONES) {
    console.log(`\n=== ${zone.toUpperCase()} ===`);

    try {
      const { encounter, encounterToken } = await client.explore(zone);
      const shiny = encounter.isShiny ? ` [${encounter.shinyVariant}]` : '';
      console.log(`Found: ${encounter.petName} Lv.${encounter.level} (${encounter.element})${shiny}`);

      // Battle
      let battle = await client.battleStart(encounterToken);
      let turns = 0;
      while (battle.battleStatus === 'ongoing' && turns < 20) {
        turns++;
        battle = await client.battleMove(battle.battleToken!, Math.floor(Math.random() * 4));
        console.log(`  Turn ${turns}: HP ${battle.yourPet?.hp}/${battle.yourPet?.maxHp} vs ${battle.wildPet?.hp}/${battle.wildPet?.maxHp}`);
      }

      if (battle.battleStatus === 'victory') {
        console.log(`Victory! +${battle.xpGained} XP`);

        // Try to catch
        const result = await client.catch(battle.battleToken!);
        console.log(result.caught ? `Caught ${result.pet?.nickname}!` : `Escaped: ${result.message}`);
      } else {
        console.log(`Result: ${battle.battleStatus}`);
      }
    } catch (e: any) {
      console.log(`Error: ${e.message}`);
    }
  }

  // Idle exploration
  console.log('\n=== IDLE WANDERING ===');
  try {
    const idle = await client.exploreIdle();
    for (const step of idle.exploration.steps) {
      console.log(`  ${step.description}`);
    }
  } catch (e: any) {
    console.log(`  ${e.message}`);
  }
}

main().catch(console.error);
