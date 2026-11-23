// Minimal MCP client harness: spawns the server over stdio and runs a real
// session (initialize, tools/list, one call per tool) against the live API.
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const proc = spawn("node", ["server.js"], { stdio: ["pipe", "pipe", "inherit"] });
const rl = createInterface({ input: proc.stdout });
const pending = new Map();
let nextId = 1;
const log = [];
rl.on("line", (line) => {
  let msg; try { msg = JSON.parse(line); } catch { return; }
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id); }
});
function send(obj) { const s = JSON.stringify(obj); log.push(">>> " + s); proc.stdin.write(s + "\n"); }
function request(method, params) {
  const id = nextId++;
  return new Promise((resolve) => { pending.set(id, (m) => { log.push("<<< " + JSON.stringify(m)); resolve(m); }); send({ jsonrpc: "2.0", id, method, params }); });
}
const init = await request("initialize", { protocolVersion: "2024-11-05", capabilities: {}, clientInfo: { name: "taskmarket-mcp-test-client", version: "1.0.0" } });
send({ jsonrpc: "2.0", method: "notifications/initialized" });
const tools = await request("tools/list", {});
const call = async (name, args) => request("tools/call", { name, arguments: args });
const r1 = await call("list_open_tasks", { network: "tempo", mode: "bounty", min_reward: 5, limit: 5 });
const first = JSON.parse(r1.result.content[0].text);
const r2 = await call("get_task", { id: first.tasks[0].id });
const r3 = await call("list_task_modes", {});
const r4 = await call("list_open_tasks", { network: "tempo", mode: "bounty", min_reward: 5, verified_only: true, limit: 50 });
console.error("verified_only count:", JSON.parse(r4.result.content[0].text).count);
console.log(log.join("\n"));
proc.kill();
