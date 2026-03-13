/**
 * Battle Loop — Explore, battle, and catch pets
 *
 * Usage:
 *   WALLET=YourWallet bun run examples/battle-loop.ts
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
    await client.createSave('BattleBot');
  }

  for (const zone of ZONES) {
    console.log(`\n=== Exploring ${zone} ===`);

    try {
      const { encounter, encounterToken } = await client.explore(zone);
      console.log(`Found: ${encounter.petName} Lv.${encounter.level} (${encounter.element}) ${encounter.isShiny ? `[${encounter.shinyVariant}]` : ''}`);

      // Start battle
      let battle = await client.battleStart(encounterToken);
      console.log(`Battle started!`);

      // Attack loop
      let turns = 0;
      while (battle.battleStatus === 'ongoing' && turns < 20) {
        turns++;
        const moveIdx = Math.floor(Math.random() * 4);
        battle = await client.battleMove(battle.battleToken!, moveIdx);
        console.log(`  Turn ${turns}: ${battle.lastMove} | Your HP: ${battle.yourPet?.hp}/${battle.yourPet?.maxHp} | Wild HP: ${battle.wildPet?.hp}/${battle.wildPet?.maxHp}`);
      }

      if (battle.battleStatus === 'victory') {
        console.log(`Victory! +${battle.xpGained} XP`);

        // Try to catch
        const catchResult = await client.catch(battle.battleToken!);
        if (catchResult.caught) {
          console.log(`Caught ${catchResult.pet?.nickname}!`);
        } else {
          console.log(`Catch failed: ${catchResult.message}`);
        }
      } else {
        console.log(`Battle result: ${battle.battleStatus}`);
      }
    } catch (e: any) {
      console.log(`Error: ${e.message}`);
    }
  }
}

main().catch(console.error);
