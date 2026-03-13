"""
06 — Python Companion

Check pet state, explore, and run an idle loop in Python.

Usage:
    WALLET=YourWallet python examples/06-python-companion.py

Install:
    pip install phettagotchi
"""

import os
import sys
import time

# Add parent to path for local dev
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from packages.python.phettagotchi import PhettagotchiClient

wallet = os.environ.get("WALLET")
if not wallet:
    print("Set WALLET env var")
    sys.exit(1)


def main():
    client = PhettagotchiClient(wallet)

    # Check state
    state = client.get_state()
    print(f"Pet: {'Yes' if state.get('hasPet') else 'No (free mode)'}")

    stats = state.get("stats", {})
    battle = state.get("battleStats", {})
    print(f"Streak: {stats.get('streak', 0)} | Level: {battle.get('level', 1)} | Mood: {stats.get('moodLabel', '?')}")
    print(f"Companion: {client.companion_url}\n")

    # Explore
    print("Exploring forest...")
    try:
        encounter = client.explore("forest")
        pet = encounter.get("encounter", {})
        print(f"Found: {pet.get('petName')} Lv.{pet.get('level')} ({pet.get('element')})")
    except Exception as e:
        print(f"Explore: {e}")

    # Idle exploration
    print("\nIdle wandering...")
    try:
        idle = client.explore_idle()
        for step in idle.get("exploration", {}).get("steps", []):
            prefix = {"walk": ">", "encounter": "!", "item": "*", "nothing": "."}
            print(f"  {prefix.get(step['type'], '?')} {step['description']}")
    except Exception as e:
        print(f"Idle: {e}")


if __name__ == "__main__":
    main()
