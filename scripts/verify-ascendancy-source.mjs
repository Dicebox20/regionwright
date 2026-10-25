import { verifyAscendancyCampaignSource } from "./ascendancy-campaign-source.mjs";

const result = verifyAscendancyCampaignSource();
console.log(JSON.stringify({
  mode: result.source.mode,
  databasePath: result.source.databasePath,
  summary: result.summary.rows[0] ?? null,
  handoff: result.source.handoffPath,
}, null, 2));
