"""Phettagotchi Wallet — Auto-generate and manage a Solana keypair.

Stores keypair at ~/.phettagotchi/keypair.json
"""

from __future__ import annotations

import json
import os
import stat
from pathlib import Path
from typing import Optional, Tuple

WALLET_DIR = Path.home() / ".phettagotchi"
KEYPAIR_FILE = "keypair.json"


def get_keypair_path(directory: Optional[Path] = None) -> Path:
    return (directory or WALLET_DIR) / KEYPAIR_FILE


def wallet_exists(directory: Optional[Path] = None) -> bool:
    return get_keypair_path(directory).exists()


def generate_wallet(directory: Optional[Path] = None) -> Tuple[str, Path]:
    """Generate a new Solana keypair and save to disk.

    Returns (public_key, keypair_path).
    Requires solders or solana-py: ``pip install solders``
    """
    try:
        from solders.keypair import Keypair  # type: ignore
    except ImportError:
        raise ImportError(
            "Install solders for wallet generation: pip install solders"
        )

    kp = Keypair()
    target_dir = directory or WALLET_DIR
    target_dir.mkdir(parents=True, exist_ok=True)
    target_path = get_keypair_path(target_dir)
    target_path.write_text(json.dumps(list(bytes(kp))))
    # Restrict permissions (owner-only read/write)
    try:
        target_path.chmod(stat.S_IRUSR | stat.S_IWUSR)
    except OSError:
        pass  # Windows may not support chmod

    return str(kp.pubkey()), target_path


def load_keypair(directory: Optional[Path] = None):
    """Load keypair from disk. Returns a solders.keypair.Keypair."""
    try:
        from solders.keypair import Keypair  # type: ignore
    except ImportError:
        raise ImportError("Install solders to load wallet: pip install solders")

    kp_path = get_keypair_path(directory)
    if not kp_path.exists():
        raise FileNotFoundError(
            f"No wallet found at {kp_path}. Call generate_wallet() first."
        )
    data = json.loads(kp_path.read_text())
    return Keypair.from_bytes(bytes(data))


def get_public_key(directory: Optional[Path] = None) -> str:
    """Get the wallet address from the stored keypair."""
    return str(load_keypair(directory).pubkey())


def ensure_wallet(directory: Optional[Path] = None) -> Tuple[str, Path, bool]:
    """Ensure a wallet exists, generating one if needed.

    Returns (public_key, keypair_path, was_created).
    """
    if wallet_exists(directory):
        return get_public_key(directory), get_keypair_path(directory), False
    pubkey, path = generate_wallet(directory)
    return pubkey, path, True


def sign_base64_transaction(unsigned_tx_b64: str, directory: Optional[Path] = None) -> str:
    """Sign a base64-encoded unsigned transaction and return base64-encoded signed tx."""
    import base64

    try:
        from solders.keypair import Keypair  # type: ignore
        from solders.transaction import Transaction  # type: ignore
    except ImportError:
        raise ImportError("Install solders for signing: pip install solders")

    kp = load_keypair(directory)
    tx_bytes = base64.b64decode(unsigned_tx_b64)
    tx = Transaction.from_bytes(tx_bytes)
    # solders Transaction signing
    signed = tx.sign([kp], tx.message.recent_blockhash)
    return base64.b64encode(bytes(signed)).decode()
