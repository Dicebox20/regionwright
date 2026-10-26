import test from "node:test";import assert from "node:assert/strict";import {readFileSync} from "node:fs";
const c=JSON.parse(readFileSync(new URL("../docs/cabin-ashen-veil/unified-bathhouse-region-install-manifest-2026-10-26.json",import.meta.url),"utf8"));
test("owner current layout is single unified Bathhouse, not new scenes",()=>{
 assert.equal(c.installStatus,"LIVE_NATIVE_REGION_CREATION_VERIFIED");assert.equal(c.environment.sceneCount,47);
 assert.equal(c.scenes.length,2);assert.equal(c.originalPreservation.scenesCreated,0);
 assert.equal(c.originalPreservation.newBehaviors,0);
});
test("native pair has the same four deterministic physical fixture IDs",()=>{
 const ids=c.sharedFixtures.map(x=>x.id);
 assert.equal(ids.length,4);assert.equal(new Set(ids).size,4);
 assert.deepEqual(c.scenes[0].installedRegionIds,ids);
 assert.deepEqual(c.scenes[1].installedRegionIds.slice(0,4),ids);
 assert.equal(c.scenes[0].afterRegions-c.scenes[0].priorRegions,4);
 assert.equal(c.scenes[1].afterRegions-c.scenes[1].priorRegions,5);
});
test("new rectangles stay within the native Foundry map, and original routes unchanged",()=>{
 const all=[...c.sharedFixtures,c.drainedOnlyFixture];
 for(const x of all){const p=x.rect;assert.ok(p.x>=0&&p.y>=0&&p.width>0&&p.height>0);assert.ok(p.x+p.width<=2160&&p.y+p.height<=1440)}
 assert.equal(c.originalPreservation.originalReturnTeleportEnabled,true);
 assert.equal(c.originalPreservation.drainedScrewdriverScriptEnabled,true);
});
test("Rosewater ring appears on drained map only; overlap flagged for future behavior integration",()=>{
 const r=c.drainedOnlyFixture;
 assert.equal(r.id,"CAVBROSEWATER001");
 assert.equal(c.scenes[0].installedRegionIds.includes(r.id),false);
 assert.equal(c.scenes[1].installedRegionIds.includes(r.id),true);
 assert.ok(r.overlap.some(x=>x.includes("CAVBATHSCRDRY001")));
 assert.equal(c.originalPreservation.sourceScriptsModified,0);
});
