"""
Basic Phettagotchi Agent (Python)

Usage:
    WALLET=YourSolanaWallet python examples/python-agent.py
"""

import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'packages', 'python'))
from phettagotchi import PhettagotchiClient


def main():
    wallet = os.environ.get("WALLET")
    if not wallet:
        print("Set WALLET env var to your Solana wallet address")
        sys.exit(1)

    with PhettagotchiClient(wallet) as client:
        # 1. Check state
        state = client.get_state()
        print(f"Pet found: {state.get('hasPet', False)}")

        if not state.get("hasPet"):
            print("No pet! Stake 1000+ $PHETTA to hatch one.")
            print(f"Companion: {client.companion_url}")
            return

        stats = state.get("stats", {})
        battle = state.get("battleStats", {})
        evo = state.get("evolution", {})
        print(f"Streak: {stats.get('streak')} | Level: {battle.get('level')} | Mood: {stats.get('moodLabel')}")
        print(f"Evolution: {evo.get('emoji')} {evo.get('stage')}")

        # 2. Check game save
        save = client.get_save()
        if not save.get("hasSave"):
            print("Creating game save...")
            client.create_save("PythonAgent")

        # 3. Explore
        print("\nExploring the forest...")
        encounter = client.explore("forest")
        enc = encounter.get("encounter", {})
        print(f"Encountered: {enc.get('petName')} (Lv.{enc.get('level')})")

        # 4. Idle exploration
        print("\nIdle wandering...")
        try:
            idle = client.explore_idle()
            summary = idle.get("summary", {})
            print(f"Biomes: {summary.get('biomesVisited')}")
            print(f"Encounters: {summary.get('encounters')}, Items: {summary.get('itemsFound')}")
            for step in idle.get("exploration", {}).get("steps", []):
                print(f"  {step.get('description')}")
        except Exception as e:
            print(f"Idle exploration: {e}")

        print(f"\nBadge URL: {client.badge_url}")


if __name__ == "__main__":
    main()
