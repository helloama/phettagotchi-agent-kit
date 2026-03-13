from .client import PhettagotchiClient
from .wallet import (
    ensure_wallet,
    generate_wallet,
    get_public_key,
    wallet_exists,
    get_keypair_path,
    sign_base64_transaction,
)

__version__ = "1.0.0"
__all__ = [
    "PhettagotchiClient",
    "ensure_wallet",
    "generate_wallet",
    "get_public_key",
    "wallet_exists",
    "get_keypair_path",
    "sign_base64_transaction",
]
