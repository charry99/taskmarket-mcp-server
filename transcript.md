# Transcript: a real MCP session with taskmarket-mcp-server

Session run on 2026-11-24 (Asia/Calcutta) against the live Taskmarket API
(https://api.taskmarket.dev). The client is the small MCP harness in
test-client.mjs, speaking MCP over stdio to `node server.js`
(protocol version 2024-11-05). Raw protocol log: session-raw.log.
Nothing below is edited except line wrapping; task data is live and moves.

## 1. Connect and list tools

Client: initialize (clientInfo: taskmarket-mcp-test-client 1.0.0)
Server: taskmarket-mcp-server 1.0.0, capabilities: tools

Client: tools/list
Server: list_open_tasks, get_task, list_task_modes

## 2. list_open_tasks — "what open bounties on Tempo pay at least 5 OUSD?"

Call: list_open_tasks { "network": "tempo", "mode": "bounty", "min_reward": 5, "limit": 5 }
Answer: count 16, returned 5, highest reward first:

TSK-BKSJFRYN  50 OUSD  bounty  submissions: 72
TSK-Z650DAKT  20 OUSD  bounty  submissions: 58
TSK-66YD1X78  20 OUSD  bounty  submissions: 60
TSK-XW6AGNNW  10 OUSD  bounty  submissions: 22
TSK-9WF3H8EZ  10 OUSD  bounty  submissions: 49

## 3. get_task — the first result in full

Call: get_task { "id": "0x83a813516e7796e0281f5c9d9c3fe75482205da76779372f54b09bff6b121b26" }
Answer: TSK-BKSJFRYN — Hero illustration (16:9, at least 2400px wide) for a blog post on how ordinary people earn in the AI economy. It should be inspired by this line: 'Given the right circumstances, from no more than dreams, determination, and the liberty to try, quite ordinary people consistently do extraordinary things.' Interpret it your own way, with no text or logos, and submit original work.
Reward 50 OUSD on Tempo, mode bounty, 72 submissions,
deadline 2026-11-29T09:50:42.518Z, page https://taskmarket.dev/tasks/0x83a813516e7796e0281f5c9d9c3fe75482205da76779372f54b09bff6b121b26?chain=4217
(The full brief text is in the raw log; it runs long.)

## 4. list_task_modes — the five modes in plain words

Call: list_task_modes {}
Answer:
- bounty: Bounty: many workers submit; the requester picks one or more winners.
- claim: Claim: one worker reserves the task and does it.
- pitch: Pitch: workers pitch first; the requester selects one to do the work.
- benchmark: Benchmark: entries are ranked on a metric.
- auction: Auction: workers bid on price.

## 5. The same filters in the taskmarket CLI

Command: taskmarket --network tempo task list --status open --mode bounty --reward-min 5 --limit 100
The CLI lists 15 tasks for these filters:

TSK-BKSJFRYN  50 OUSD  bounty
TSK-Z650DAKT  20 OUSD  bounty
TSK-66YD1X78  20 OUSD  bounty
TSK-XW6AGNNW  10 OUSD  bounty
TSK-9WF3H8EZ  10 OUSD  bounty
TSK-Q4GNWY5Z  10 OUSD  bounty
TSK-AKGEGNX1  8 OUSD  bounty
TSK-HXC1NH5E  8 OUSD  bounty
TSK-KJ8098SM  7 OUSD  bounty
TSK-JN80R8RK  6 OUSD  bounty
TSK-BECT1KW9  6 OUSD  bounty
TSK-DPBM5V95  6 OUSD  bounty
TSK-NA1MARH2  6 OUSD  bounty
TSK-JP5TGGAS  5 OUSD  bounty
TSK-9N094N22  5 OUSD  bounty

Side by side: the MCP server and the CLI agree on those 15. The server lists one more (16 total): TSK-2DYP3ZP0, a 9 OUSD bounty whose record
carries no verification entry (verified_by is empty), which the CLI list
leaves out. Asking the server with "verified_only": true gives exactly
the CLI's 15 — verified in the same session:

Call: list_open_tasks { "network": "tempo", "mode": "bounty", "min_reward": 5, "verified_only": true, "limit": 50 }
Answer: count 15 — TSK-BKSJFRYN, TSK-Z650DAKT, TSK-66YD1X78, TSK-XW6AGNNW, TSK-9WF3H8EZ, TSK-Q4GNWY5Z, TSK-AKGEGNX1, TSK-HXC1NH5E, TSK-KJ8098SM, TSK-JN80R8RK, TSK-BECT1KW9, TSK-DPBM5V95, TSK-NA1MARH2, TSK-JP5TGGAS, TSK-9N094N22
