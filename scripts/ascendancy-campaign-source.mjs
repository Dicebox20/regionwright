import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const REGION_EDITOR_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const DEFAULT_HELPER_ROOT = "C:/Users/rujie/Documents/Codex/2026-08-20/dicebox-campaign-helper";
const QUERY_KINDS = new Set(["facts", "decisions", "trials", "blockers", "subject", "plan", "sources", "coverage", "summary"]);

/**
 * The DiceBox knowledge base is a development-time source, not a Foundry
 * runtime store. Keep the path shared with the helper checkout and never
 * copy, migrate, or write to its SQLite file from Region Editor.
 */
export function createAscendancyCampaignSource({ helperRoot = process.env.DICEBOX_CAMPAIGN_HELPER_ROOT ?? DEFAULT_HELPER_ROOT } = {}) {
  const root = path.resolve(helperRoot);
  return Object.freeze({
    mode: "read-only",
    helperRoot: root,
    databasePath: path.join(root, "database", "dicebox_campaign_helper_knowledge.sqlite"),
    queryScript: path.join(root, "database", "query_knowledge.py"),
    handoffPath: path.join(root, "packages", "dicebox-core", "src", "ascendancy-handoff.ts"),
    handoffTestPath: path.join(root, "tests", "ascendancy-handoff.test.ts"),
    handoffDocPath: path.join(root, "docs", "ASCENDANCY-REGIONWRIGHT-HANDOFF-2026-08-21.md"),
    handoffReceiptPath: path.join(root, "outputs", "m28-ascendancy-regionwright-handoff-static-receipt.json"),
    regionEditorRoot: REGION_EDITOR_ROOT,
  });
}

function queryArguments(request) {
  if (!request || typeof request !== "object" || !QUERY_KINDS.has(request.kind)) {
    throw new Error("A supported, bounded DiceBox knowledge-base query kind is required.");
  }
  const args = ["--kind", request.kind];
  if (request.term != null) args.push("--term", String(request.term));
  if (request.subjectNo != null) args.push("--subject-no", String(request.subjectNo));
  if (request.domain != null) args.push("--domain", String(request.domain));
  if (request.limit != null) args.push("--limit", String(request.limit));
  return args;
}

/**
 * Invoke the helper's fixed-operation query service. The service opens SQLite
 * with mode=ro and accepts no SQL from this caller.
 */
export function queryAscendancyCampaignSource(request, { source = createAscendancyCampaignSource(), python = "python" } = {}) {
  if (!existsSync(source.databasePath)) throw new Error(`DiceBox knowledge base is missing: ${source.databasePath}`);
  if (!existsSync(source.queryScript)) throw new Error(`DiceBox query service is missing: ${source.queryScript}`);
  const output = execFileSync(python, [source.queryScript, "--database", source.databasePath, ...queryArguments(request)], {
    cwd: source.helperRoot,
    encoding: "utf8",
    windowsHide: true,
    maxBuffer: 1024 * 1024,
  });
  const response = JSON.parse(output);
  if (response.mode !== "read-only" || response.databasePath !== source.databasePath) {
    throw new Error("DiceBox knowledge-base response failed the read-only source boundary.");
  }
  return response;
}

export function verifyAscendancyCampaignSource(source = createAscendancyCampaignSource()) {
  const requiredFiles = [source.databasePath, source.queryScript, source.handoffPath, source.handoffTestPath, source.handoffDocPath, source.handoffReceiptPath];
  const missing = requiredFiles.filter(file => !existsSync(file));
  if (missing.length) throw new Error(`DiceBox Ascendancy source is incomplete: ${missing.join(", ")}`);
  const summary = queryAscendancyCampaignSource({ kind: "summary" }, { source });
  return Object.freeze({ source, summary });
}
