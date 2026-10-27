import test from "node:test";
import assert from "node:assert/strict";
import {planSilverTinyKeyMarker,assessHopeChestUnlock} from "../modules/regionwright/scripts/studio-cav-late-silver-hope-contract.js";

const marker = () => ({
  version:1,origin:"elected-gm-readback",crimsonVeilStarted:false,
  secondChaseStatus:"completed",secondChaseOutcome:"escaped",silverKeyMarkerStatus:"none",
  northwestBustScene:"SG-01",bustRegionVerified:true,bustRegionUuid:"Scene.VERIFIED.Region.NW",
  keySourceVerified:true,silverKeySourceUuid:"Item.VERIFIED"
});
const chest = () => ({
  version:1,origin:"elected-gm-readback",chestSceneId:"CAVHU04Scene0001",
  chestRegionVerified:true,chestRegionUuid:"Scene.CAVHU04Scene0001.Region.VERIFIED",
  explicitPlayerClick:true,activeNonGMOwnerAtChest:true,actorId:"ACTOR",tokenId:"TOKEN",
  chestLedgerStatus:"locked",sourceRegistryVerified:true,
  expectedSilverKeySourceUuid:"Item.VERIFIED",
  expectedMarkerRegionUuid:"Scene.VERIFIED.Region.NW",
  actorInventorySilverKeyPresent:true,keyItemSourceUuid:"Item.VERIFIED",
  keyItemMarkerRegionUuid:"Scene.VERIFIED.Region.NW"
});
test("GM-confirmed second chase stages recoverable ground marker, not auto Item award",()=>{
  assert.deepEqual(planSilverTinyKeyMarker(marker()),{action:"stage-marker",reason:"eligible-for-once-only-ground-marker"});
});
for(const outcome of ["escaped","captured"]) test("chase completion "+outcome+" can reveal marker",()=>{
  assert.equal(planSilverTinyKeyMarker({...marker(),secondChaseOutcome:outcome}).action,"stage-marker");
});
for(const status of ["visible","claimed"]) test("marker "+status+" never stages second copy",()=>{
  assert.equal(planSilverTinyKeyMarker({...marker(),silverKeyMarkerStatus:status}).action,"no-op");
});
test("reserved marker stops for reconciliation",()=>assert.equal(planSilverTinyKeyMarker({...marker(),silverKeyMarkerStatus:"reserved"}).action,"gm-review"));
test("unknown marker status stops for reconciliation",()=>assert.equal(planSilverTinyKeyMarker({...marker(),silverKeyMarkerStatus:"corrupt"}).action,"gm-review"));
test("no chase completion never drops key",()=>assert.equal(planSilverTinyKeyMarker({...marker(),secondChaseStatus:"running"}).action,"deny"));
test("post Veil skipped chase requires manual GM recovery, not pursuit",()=>assert.deepEqual(
  planSilverTinyKeyMarker({...marker(),crimsonVeilStarted:true,secondChaseStatus:"not-started"}),
  {action:"gm-review",reason:"post-veil-skipped-chase-recovery"}));
test("post Veil completed chase may preserve outstanding physical key",()=>assert.equal(planSilverTinyKeyMarker({...marker(),crimsonVeilStarted:true}).action,"stage-marker"));
test("wrong SG map denies",()=>assert.equal(planSilverTinyKeyMarker({...marker(),northwestBustScene:"SG-05"}).action,"deny"));
test("missing original Item source denies",()=>assert.equal(planSilverTinyKeyMarker({...marker(),keySourceVerified:false}).action,"deny"));
test("missing GM signature context denies",()=>assert.equal(planSilverTinyKeyMarker({...marker(),origin:"client"}).action,"deny"));

test("authentic inventory Silver Tiny Key enables chest unlock review only",()=>{
  assert.deepEqual(assessHopeChestUnlock(chest()),{eligible:true,reason:"eligible-for-gm-once-only-chest-unlock"});
});
test("not physically at Parents chest denies",()=>assert.equal(assessHopeChestUnlock({...chest(),activeNonGMOwnerAtChest:false}).eligible,false));
test("opening chest requires explicit click",()=>assert.equal(assessHopeChestUnlock({...chest(),explicitPlayerClick:false}).eligible,false));
test("wrong Room/Region denies",()=>assert.equal(assessHopeChestUnlock({...chest(),chestSceneId:"CAVHU05Scene0001"}).eligible,false));
test("client-provided proof denies",()=>assert.equal(assessHopeChestUnlock({...chest(),origin:"client"}).eligible,false));
test("wrong key source cannot open chest",()=>assert.equal(assessHopeChestUnlock({...chest(),keyItemSourceUuid:"Item.FAKE"}).eligible,false));
test("generic same-name key without provenance cannot open",()=>assert.equal(assessHopeChestUnlock({...chest(),keyItemSourceUuid:undefined}).eligible,false));
test("wrong pickup Region provenance cannot open",()=>assert.equal(assessHopeChestUnlock({...chest(),keyItemMarkerRegionUuid:"Scene.FAKE.Region.NW"}).eligible,false));
test("source registry must be verified",()=>assert.equal(assessHopeChestUnlock({...chest(),sourceRegistryVerified:false}).eligible,false));
test("key must actually be in acting actor inventory",()=>assert.equal(assessHopeChestUnlock({...chest(),actorInventorySilverKeyPresent:false}).eligible,false));
test("reserved chest requires GM reconciliation",()=>assert.equal(assessHopeChestUnlock({...chest(),chestLedgerStatus:"reserved"}).reason,"manual-reconciliation-required"));
test("open chest refuses second opening",()=>assert.equal(assessHopeChestUnlock({...chest(),chestLedgerStatus:"unlocked"}).reason,"already-unlocked"));
test("uncertain chest ledger fails closed",()=>assert.equal(assessHopeChestUnlock({...chest(),chestLedgerStatus:undefined}).eligible,false));