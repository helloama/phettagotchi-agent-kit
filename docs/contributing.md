# Contributing to Phettagotchi Agent Kit

Thanks for your interest in contributing!

## Setup

```bash
git clone https://github.com/helloama/phettagotchi-agent-kit.git
cd phettagotchi-agent-kit
```

### TypeScript SDK
```bash
cd packages/sdk
npm install
npm run build
```

### Python SDK
```bash
cd packages/python
pip install -e .
```

### MCP Server
```bash
cd packages/mcp-server
npm install
npm run build
```

## Project Structure

```
phettagotchi-agent-kit/
  packages/
    sdk/          — TypeScript SDK (@phettagotchi/sdk)
    python/       — Python SDK (pip install phettagotchi)
    mcp-server/   — MCP server for Claude Desktop/Cursor
    solana-agent-kit/ — Solana Agent Kit v2 plugin
  skills/
    openclaw/     — OpenClaw/ClawHub skill file
  examples/       — Ready-to-run example agents
  docs/           — API reference and guides
```

## Guidelines

- Keep it simple — these are wrappers around the REST API
- Don't include private keys or .env files
- Test against the live API at phettagotchi.com
- Follow existing code style

## Reporting Issues

Open an issue at [github.com/helloama/phettagotchi-agent-kit/issues](https://github.com/helloama/phettagotchi-agent-kit/issues)
