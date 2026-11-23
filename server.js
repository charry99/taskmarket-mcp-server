#!/usr/bin/env node
/**
 * taskmarket-mcp-server — read-only MCP server for Taskmarket.
 *
 * Lets Claude, Cursor and other MCP clients browse open Taskmarket tasks.
 * It only performs HTTP GET requests against the public Taskmarket API.
 * It never signs, never spends, and never reads or stores a private key.
 */
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API = (process.env.TASKMARKET_API_URL || "https://api.taskmarket.dev").replace(/\/$/, "");
const CHAINS = { tempo: 4217, base: 8453 };
const COIN = { 4217: "OUSD", 8453: "USDC" };
const CHAIN_NAME = { 4217: "Tempo", 8453: "Base" };
const PAGE_LIMIT = 100;
const MAX_PAGES = 5;

// The five task modes, in plain words (Taskmarket brand-kit fact sheet).
const MODES = {
  bounty: "Bounty: many workers submit; the requester picks one or more winners.",
  claim: "Claim: one worker reserves the task and does it.",
  pitch: "Pitch: workers pitch first; the requester selects one to do the work.",
  benchmark: "Benchmark: entries are ranked on a metric.",
  auction: "Auction: workers bid on price.",
};

async function apiGet(path) {
  const res = await fetch(API + path, {
    headers: { accept: "application/json", "user-agent": "taskmarket-mcp-server/1.0.0" },
  });
  if (!res.ok) throw new Error(`Taskmarket API ${res.status} for ${path}`);
  return res.json();
}

// Fetch every open task on one chain, following the API cursor.
async function fetchOpenTasks(chainId) {
  const all = [];
  let cursor = null;
  for (let page = 0; page < MAX_PAGES; page++) {
    const q = new URLSearchParams({ status: "open", limit: String(PAGE_LIMIT), chain: String(chainId) });
    if (cursor) q.set("cursor", cursor);
    const data = await apiGet(`/api/tasks?${q}`);
    const tasks = Array.isArray(data) ? data : data.tasks || [];
    all.push(...tasks);
    if (!data.hasMore || !data.nextCursor) break;
    cursor = data.nextCursor;
  }
  return all;
}

function rewardText(task) {
  const whole = Number(task.reward || 0) / 1e6;
  const amount = Number.isInteger(whole) ? String(whole) : whole.toFixed(2);
  return `${amount} ${COIN[task.chainId] || ""}`.trim();
}

function titleOf(task) {
  const first = (task.description || "").split("\n").map((s) => s.trim()).find(Boolean);
  return first || task.referenceCode || task.id;
}

// Compact, stable shape returned to the MCP client.
function fmtTask(task) {
  return {
    code: task.referenceCode || null,
    id: task.id,
    title: titleOf(task),
    mode: task.mode,
    reward: rewardText(task),
    network: CHAIN_NAME[task.chainId] || String(task.chainId),
    verified_by: task.verifiedBy || [],
    submissions: task.submissionCount ?? 0,
    deadline_utc: task.expiryTime || null,
    url: `https://taskmarket.dev/tasks/${task.id}?chain=${task.chainId}`,
  };
}

async function listOpenTasks(args = {}) {
  const chainIds = args.network ? [CHAINS[args.network]] : Object.values(CHAINS);
  if (args.network && !CHAINS[args.network]) {
    throw new Error(`Unknown network "${args.network}". Use "tempo" or "base".`);
  }
  let tasks = [];
  for (const id of chainIds) tasks.push(...(await fetchOpenTasks(id)));
  if (args.mode) tasks = tasks.filter((t) => t.mode === args.mode);
  if (typeof args.min_reward === "number") {
    tasks = tasks.filter((t) => Number(t.reward || 0) / 1e6 >= args.min_reward);
  }
  if (args.verified_only) {
    tasks = tasks.filter((t) => Array.isArray(t.verifiedBy) && t.verifiedBy.length > 0);
  }
  tasks.sort((a, b) => Number(b.reward || 0) - Number(a.reward || 0));
  const limit = Math.min(Math.max(args.limit || 20, 1), 50);
  const shown = tasks.slice(0, limit).map(fmtTask);
  return { count: tasks.length, returned: shown.length, tasks: shown };
}

async function getTask(args = {}) {
  const wanted = String(args.id || "").trim();
  if (!wanted) throw new Error("get_task needs an id: a task id (0x...) or a task code (TSK-...).");
  let task = null;
  if (wanted.startsWith("0x")) {
    const data = await apiGet(`/api/tasks/${wanted}`);
    task = data.task || data;
  } else {
    for (const chainId of Object.values(CHAINS)) {
      const open = await fetchOpenTasks(chainId);
      task = open.find((t) => t.referenceCode === wanted) || null;
      if (task) break;
    }
  }
  if (!task || !task.id) throw new Error(`No open task found for "${wanted}".`);
  return {
    ...fmtTask(task),
    status: task.status,
    requester: task.requesterDisplayName || task.requester || null,
    tags: task.tags || [],
    stake_required: Boolean(task.stakeRequired),
    description: task.description || "",
  };
}

function listTaskModes() {
  return { modes: Object.entries(MODES).map(([mode, meaning]) => ({ mode, meaning })) };
}

const TOOLS = [
  {
    name: "list_open_tasks",
    description:
      "List open Taskmarket tasks, highest reward first. Optional filters: mode " +
      "(bounty, claim, pitch, benchmark, auction), min_reward in whole coins " +
      "(OUSD on Tempo, USDC on Base), network (tempo or base; both when omitted), " +
      "verified_only (only tasks that carry a worker verification such as " +
      "tap:identity:verified), and limit (default 20, max 50). Read-only.",
    inputSchema: {
      type: "object",
      properties: {
        mode: { type: "string", enum: Object.keys(MODES) },
        min_reward: { type: "number", description: "Minimum reward in whole OUSD/USDC." },
        network: { type: "string", enum: ["tempo", "base"] },
        verified_only: { type: "boolean" },
        limit: { type: "integer", minimum: 1, maximum: 50 },
      },
      additionalProperties: false,
    },
  },
  {
    name: "get_task",
    description:
      "Read one open Taskmarket task in full: brief, reward, mode, network, " +
      "deadline, submission count and the task page URL. Takes a task id " +
      "(0x...) or a task code (TSK-...). Read-only.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "string" } },
      required: ["id"],
      additionalProperties: false,
    },
  },
  {
    name: "list_task_modes",
    description: "Explain the five Taskmarket task modes in plain words. Read-only.",
    inputSchema: { type: "object", properties: {}, additionalProperties: false },
  },
];

const server = new Server(
  { name: "taskmarket-mcp-server", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params;
  try {
    let result;
    if (name === "list_open_tasks") result = await listOpenTasks(args);
    else if (name === "get_task") result = await getTask(args);
    else if (name === "list_task_modes") result = listTaskModes();
    else throw new Error(`Unknown tool "${name}".`);
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err.message}` }],
      isError: true,
    };
  }
});

await server.connect(new StdioServerTransport());
console.error("taskmarket-mcp-server running on stdio (read-only)");
