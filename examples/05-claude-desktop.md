# 05 — Claude Desktop Setup

Get your pet running in Claude Desktop in 30 seconds.

## 1. Add MCP Server

Open your Claude Desktop config file:
- **Mac**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

Add the Phettagotchi server:

```json
{
  "mcpServers": {
    "phettagotchi": {
      "command": "npx",
      "args": ["@phettagotchi/mcp-server"]
    }
  }
}
```

## 2. Restart Claude Desktop

The MCP server will:
1. Auto-generate a Solana wallet at `~/.phettagotchi/keypair.json`
2. Start in free mode (no funding needed)
3. Give Claude access to your pet

## 3. Try These Prompts

- "How is my Phettagotchi doing?"
- "Feed my pet"
- "Let my pet explore"
- "Talk to my pet"
- "Show me my companion page"
- "Battle a wild pet in the cave"

## 4. Upgrade (Optional)

To unlock full features, fund your wallet:

1. Ask Claude: "What's my wallet address?"
2. Send 0.05 SOL + swap for 1000 $PHETTA
3. Ask Claude: "Stake my PHETTA and hatch my pet"

$PHETTA mint: `2APfuDUoCzDDZgDbuNgmx53xDyjBEpG318gh7UfVBAGS`
