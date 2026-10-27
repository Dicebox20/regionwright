import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {createHash} from "node:crypto";
import {
 CAV_ROOF_ORIGINAL_PLAYER_SHA,CAV_ROOF_REGION,CAV_ROOF_BEHAVIOR,
 patchCavRoofOriginalPlayerScript,cavRoofScriptHash
} from "../modules/regionwright/scripts/studio-cav-roof-player-parity.js";
const original=readFileSync(new URL("../docs/cabin-ashen-veil/native-source-snapshots/cav-roof-player-original-20261026.js.txt",import.meta.url),"utf8");
const sha=s=>createHash("sha256").update(s.trim()).digest("hex");
test("Original native Rooftop Region and source identity pinned",()=>{
 assert.equal(cavRoofScriptHash(original),CAV_ROOF_ORIGINAL_PLAYER_SHA);
 assert.equal(CAV_ROOF_REGION,"Scene.LhtyO17QenuCExsb.Region.CAVROOFCLOCKR001");
 assert.equal(CAV_ROOF_BEHAVIOR,"i6UNtWSFFaZgkdZD");
});
test("Reworked client script has valid Foundry async Function grammar",()=>{
 const changed=patchCavRoofOriginalPlayerScript(original);
 assert.doesNotThrow(()=>new (Object.getPrototypeOf(async function(){}).constructor)("scene","region","event",changed));
 assert.notEqual(sha(changed),sha(original));
});
test("Authentic Grandfather and Attic reward DONE receipts required before offering clock controls",()=>{
 const changed=patchCavRoofOriginalPlayerScript(original);
 for(const claim of ["cavGrandfatherClockHourHandClaim","cavAtticMinuteHandClaim"]){
  assert.ok(changed.includes("getFlag(NS,'"+claim+"')"));
 }
 assert.ok(changed.includes("hourClaim?.status==='done'"));
 assert.ok(changed.includes("minuteClaim?.status==='done'"));
 assert.ok(changed.includes("i.id===hourClaim.embeddedItemId"));
 assert.ok(changed.includes("i.id===minuteClaim.embeddedItemId"));
 assert.ok(changed.includes("hourClaim.actorId===actor.id"));
 assert.ok(changed.includes("minuteClaim.actorId===actor.id"));
});
test("Original item provenance and location still checked",()=>{
 const changed=patchCavRoofOriginalPlayerScript(original);
 for(const v of ["Item.HVZnNaV2SxNWck6H","Item.smvovibxtjJ9NW56",
  "Scene.CAVHG06GreatRoom.Region.MrWgTyGg0d0DI53Q",
  "Scene.nyF5EX0JiEu23C3p.Region.UtXhS68vd1czWfTG"]){
 assert.ok(changed.includes(v));}
});
test("Client mirrors elected GM's 400px character-token clock range",()=>{
 const changed=patchCavRoofOriginalPlayerScript(original);
 assert.match(changed,/Math\.hypot\(doc\.x\+doc\.width\*grid\/2-/);
 assert.match(changed,/\)\s*<=400/);
 assert.match(changed,/const canEngage=hasHour&&hasMinute&&near/);
});
test("Player close-up remains usable; Engage only with verified complete awards and proximity",()=>{
 const changed=patchCavRoofOriginalPlayerScript(original);
 assert.match(changed,/if\(!canEngage\|\|solved\|\|!doc\)return true/);
 assert.match(changed,/ok:\{label:canEngage&&!solved\?/);
 assert.match(changed,/\(canEngage&&!solved\?/);
 assert.ok(changed.includes("const status=solved?"));
});
test("No new native player-side world mutations and original GM authentication unchanged",()=>{
 const changed=patchCavRoofOriginalPlayerScript(original);
 assert.doesNotMatch(changed,/\.setFlag\(/);
 assert.doesNotMatch(changed,/createEmbeddedDocuments/);
 assert.match(changed,/cavRoofClockAttempt/);
 assert.match(changed,/whisper:\[gm\.id,game\.user\.id\]/);
});
test("Patch refuses unrecognized, already changed, or ambiguous source",()=>{
 assert.throws(()=>patchCavRoofOriginalPlayerScript(original+"\n//unknown"),/SHA mismatch/);
 const changed=patchCavRoofOriginalPlayerScript(original);
 assert.throws(()=>patchCavRoofOriginalPlayerScript(changed),/SHA mismatch/);
 assert.throws(()=>patchCavRoofOriginalPlayerScript(""),/SHA mismatch/);
});
