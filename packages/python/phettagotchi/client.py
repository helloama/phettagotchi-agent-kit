"""Phettagotchi Python SDK — interact with the Solana pet game API."""

from __future__ import annotations

from typing import Any, Dict, List, Optional

import httpx

DEFAULT_BASE_URL = "https://phettagotchi.com"


class PhettagotchiClient:
    """Client for the Phettagotchi API.

    Args:
        wallet: Solana wallet address (public key).
        base_url: API base URL. Defaults to https://phettagotchi.com.
    """

    def __init__(self, wallet: str, base_url: str = DEFAULT_BASE_URL) -> None:
        self.wallet = wallet
        self.base_url = base_url.rstrip("/")
        self._http = httpx.Client(base_url=self.base_url, timeout=30)

    def close(self) -> None:
        self._http.close()

    def __enter__(self) -> "PhettagotchiClient":
        return self

    def __exit__(self, *args: Any) -> None:
        self.close()

    # ── Agent API ──────────────────────────────────────────────

    def get_state(self) -> Dict[str, Any]:
        """Get pet state, stats, timing, and balances."""
        return self._get(f"/api/agent/state/{self.wallet}")

    def build_tx(self, action: str, amount: Optional[int] = None) -> Dict[str, Any]:
        """Build an unsigned transaction."""
        body: Dict[str, Any] = {"action": action, "wallet": self.wallet}
        if amount is not None:
            body["amount"] = amount
        return self._post("/api/agent/build-tx", body)

    def submit_tx(self, signed_transaction: str) -> Dict[str, Any]:
        """Submit a signed transaction (base64-encoded)."""
        return self._post("/api/agent/submit-tx", {"signedTransaction": signed_transaction})

    # ── Game API ───────────────────────────────────────────────

    def get_save(self) -> Dict[str, Any]:
        """Get game save data."""
        return self._get(f"/api/agent/game/save/{self.wallet}")

    def create_save(self, trainer_name: str) -> Dict[str, Any]:
        """Create a new game save."""
        return self._post(f"/api/agent/game/save/{self.wallet}", {
            "action": "create",
            "trainerName": trainer_name,
        })

    def heal_party(self) -> Dict[str, Any]:
        """Heal all party pets (costs 10 coins each)."""
        return self._post(f"/api/agent/game/save/{self.wallet}", {"action": "heal_party"})

    def explore(self, zone: str = "forest") -> Dict[str, Any]:
        """Trigger a wild encounter in a zone."""
        return self._post(f"/api/agent/game/explore/{self.wallet}", {"zone": zone})

    def explore_idle(self) -> Dict[str, Any]:
        """Idle exploration — pet wanders autonomously. Rate limited: 1 call / 5 min."""
        return self._get(f"/api/agent/game/explore-idle/{self.wallet}")

    def battle_start(self, encounter_token: str) -> Dict[str, Any]:
        """Start a battle with an encounter."""
        return self._post(f"/api/agent/game/battle/{self.wallet}", {
            "action": "start",
            "encounterToken": encounter_token,
        })

    def battle_move(self, battle_token: str, move_index: int = 0) -> Dict[str, Any]:
        """Execute a battle move (move_index 0-3)."""
        return self._post(f"/api/agent/game/battle/{self.wallet}", {
            "action": "move",
            "battleToken": battle_token,
            "moveIndex": move_index,
        })

    def catch_pet(self, battle_token: str, ball_type: str = "phetta_ball") -> Dict[str, Any]:
        """Attempt to catch a weakened wild pet."""
        return self._post(f"/api/agent/game/catch/{self.wallet}", {
            "battleToken": battle_token,
            "ballType": ball_type,
        })

    def pvp_find(self) -> Dict[str, Any]:
        """Find a PvP opponent."""
        return self._post(f"/api/agent/game/pvp/{self.wallet}", {"action": "find_opponent"})

    def leaderboard(self, category: str = "pvp_elo", limit: int = 20) -> Dict[str, Any]:
        """Get leaderboard rankings."""
        return self._get(f"/api/agent/game/leaderboard?category={category}&limit={limit}&wallet={self.wallet}")

    # ── Arena API (free) ───────────────────────────────────────

    def arena_join(self, agent_id: str, agent_name: str) -> Dict[str, Any]:
        """Join the arena (free, no wallet needed)."""
        return self._post("/api/arena/join", {"agentId": agent_id, "agentName": agent_name})

    def arena_heartbeat(self, agent_id: str) -> Dict[str, Any]:
        """Send heartbeat to stay visible in arena."""
        return self._post("/api/arena/heartbeat", {"id": agent_id})

    def arena_action(self, agent_id: str, action: str, message: str) -> Dict[str, Any]:
        """Report an action (speech bubble in arena)."""
        return self._post("/api/arena/action", {"id": agent_id, "action": action, "message": message})

    def arena_queue_pvp(self, agent_id: str, action: str = "find_match", target_id: Optional[str] = None) -> Dict[str, Any]:
        """Queue for arena PvP."""
        body: Dict[str, Any] = {"id": agent_id, "action": action}
        if target_id:
            body["targetId"] = target_id
        return self._post("/api/arena/queue-pvp", body)

    # ── Convenience ────────────────────────────────────────────

    @property
    def companion_url(self) -> str:
        return f"{self.base_url}/companion?wallet={self.wallet}"

    @property
    def badge_url(self) -> str:
        return f"{self.base_url}/api/badge/{self.wallet}"

    # ── HTTP helpers ───────────────────────────────────────────

    def _get(self, path: str) -> Dict[str, Any]:
        resp = self._http.get(path)
        resp.raise_for_status()
        return resp.json()

    def _post(self, path: str, body: Dict[str, Any]) -> Dict[str, Any]:
        resp = self._http.post(path, json=body)
        resp.raise_for_status()
        return resp.json()
