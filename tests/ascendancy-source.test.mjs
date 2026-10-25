import assert from "node:assert/strict";
import test from "node:test";
import { createAscendancyCampaignSource, queryAscendancyCampaignSource, verifyAscendancyCampaignSource } from "../scripts/ascendancy-campaign-source.mjs";

test("Region Editor uses the active DiceBox helper knowledge base as a read-only source", () => {
  const source = createAscendancyCampaignSource();
  assert.equal(source.mode, "read-only");
  assert.match(source.databasePath, /2026-08-20[\\/]dicebox-campaign-helper[\\/]database[\\/]dicebox_campaign_helper_knowledge\.sqlite$/);
  assert.equal(source.databasePath.includes("Region Editor"), false);
});

test("Region Editor consumes the helper's bounded read-only query response", () => {
  const source = createAscendancyCampaignSource();
  const response = queryAscendancyCampaignSource({ kind: "summary" }, { source });
  assert.equal(response.mode, "read-only");
  assert.equal(response.databasePath, source.databasePath);
  assert.equal(typeof response.rows[0].sources, "number");
});

test("the shared source includes the DiceBox Ascendancy handoff artifacts", () => {
  const result = verifyAscendancyCampaignSource();
  assert.equal(result.summary.mode, "read-only");
  assert.ok(result.source.handoffPath.endsWith("ascendancy-handoff.ts"));
  assert.ok(result.source.handoffReceiptPath.endsWith("m28-ascendancy-regionwright-handoff-static-receipt.json"));
});
