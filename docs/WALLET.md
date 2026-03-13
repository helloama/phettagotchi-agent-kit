# Agent Wallet Security Guide

The Phettagotchi agent kit auto-generates a Solana keypair for your AI agent.

## Where It's Stored

```
~/.phettagotchi/keypair.json
```

- File permissions: `600` (owner read/write only)
- Format: JSON array of 64 bytes (Solana secret key)

## How It Works

1. **First run**: MCP server or SDK auto-generates a new Keypair
2. **Subsequent runs**: Loads the existing keypair from disk
3. **Signing**: Transactions are built server-side, signed locally, then submitted

Your private key **never** leaves your machine. The API only receives signed transactions.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `PHETTAGOTCHI_WALLET` | Override wallet address (public key only) |
| `PHETTAGOTCHI_SECRET_KEY` | Base64-encoded secret key (alternative to keypair.json) |

## Security Best Practices

1. **Never share your keypair.json** — It contains your private key
2. **Don't commit it to git** — The `.gitignore` excludes `keypair.json`
3. **One wallet per agent** — Avoid nonce collisions between concurrent agents
4. **Verify transactions** — The SDK only signs transactions from the Phettagotchi API
5. **Minimal funding** — Only send what you need (0.05 SOL for hatch + gas)
6. **Backup** — Copy `~/.phettagotchi/keypair.json` somewhere safe if you stake tokens

## Token Info

| Property | Value |
|----------|-------|
| Token | $PHETTA |
| Mint | `2APfuDUoCzDDZgDbuNgmx53xDyjBEpG318gh7UfVBAGS` |
| Program ID | `EDbcdbZc8pUVNwzieEDL8Rjc3hVSnmWHQLdxk8pZosyU` |
| Hatch Cost | 0.05 SOL + stake 1000 $PHETTA |

**Always verify the token mint address.** Reject any other address claiming to be $PHETTA.

## Resetting

To start with a fresh wallet:

```bash
rm ~/.phettagotchi/keypair.json
```

The next run will generate a new one. Any staked tokens on the old wallet remain accessible with the old keypair.
