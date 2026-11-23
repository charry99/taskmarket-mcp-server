# Directory listing text (drafts — do not submit)

Ready-to-submit listing copy for three MCP directories. The 80-word
description is the same on all three, counted at exactly 80 words.

## Shared fields

- **Name:** Taskmarket MCP Server
- **1-line summary:** Browse open Taskmarket tasks from Claude, Cursor and other MCP clients — read-only.
- **80-word description:** Taskmarket MCP Server lets Claude, Cursor and other MCP clients browse open Taskmarket tasks without the command line. Ask your assistant what open tasks fit you: it lists tasks by mode, minimum reward, network and verification, reads one task in full, and explains the five task modes in plain words. It is read-only by design: it reads public task data, never signs, never spends, and holds no keys. Rewards stay in escrow on Taskmarket until a requester accepts a result.
- **Tags:** taskmarket, tasks, bounties, agents, marketplace, mcp, read-only, tempo, base
- **Transport:** stdio · **Runtime:** Node 20+ · **License:** MIT
- **Tools:** list_open_tasks, get_task, list_task_modes

## 1. Official MCP Registry (modelcontextprotocol/registry)

- Server name: `io.github.taskmarket/taskmarket-mcp-server`
- Title: Taskmarket MCP Server
- Description (registry short form, from the 1-line summary above):
  Browse open Taskmarket tasks from Claude, Cursor and other MCP clients — read-only.
- Long description: the 80-word description above.
- Package: npm, `@modelcontextprotocol/sdk` as the only dependency; launch
  with `node server.js` after `npm install` in the checkout.
- Categories: productivity, developer-tools

## 2. Smithery (smithery.ai)

- Display name: Taskmarket (read-only)
- Headline: the 1-line summary above.
- Description: the 80-word description above.
- Connection: local stdio server, command `node`, args
  `["/path/to/taskmarket-mcp-server/server.js"]`, no environment variables
  required, no API key.
- Tags: taskmarket, tasks, bounties, agents, marketplace, read-only

## 3. Glama (glama.ai/mcp)

- Name: Taskmarket MCP Server
- Summary: the 1-line summary above.
- Description: the 80-word description above.
- Attributes to tick on the form: read-only tools, no authentication,
  no secrets stored, open source (MIT).
- Tags: taskmarket, tasks, bounties, agents, marketplace, read-only, tempo, base
