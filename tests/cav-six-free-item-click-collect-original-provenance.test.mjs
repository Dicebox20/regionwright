import test from "node:test";import assert from "node:assert/strict";
import{readFileSync}from"node:fs";import{createHash}from"node:crypto";
import{CAV_FREE_CLICK_PICKUPS,isCavFreePickupNear}from"../modules/regionwright/scripts/studio-cav-free-pickup-click.js";
const M=JSON.parse(readFileSync(new URL("../docs/cabin-ashen-veil/cav-six-free-click-pickup-original-behavior-source-manifest-2026-10-27.json",import.meta.url),"utf8"));
const sha=s=>createHash("sha256").update(s).digest("hex");
test("Exactly the six sanctioned original freely retrievable items, no puzzle answers or staged gates",()=>{
assert.equal(CAV_FREE_CLICK_PICKUPS.length,6);assert.equal(M.plan.length,6);
assert.deepEqual(new Set(M.plan.map(x=>x.scene+"."+x.region)),new Set(CAV_FREE_CLICK_PICKUPS.map(x=>x.scene+"."+x.region)));
assert.ok(CAV_FREE_CLICK_PICKUPS.every(x=>x.item&&x.ledger&&x.sourceFlag&&x.regionFlag));
});
test("All six original native move Behaviors also accept player click inspection",()=>{
const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
for(const p of M.plan){
assert.equal(sha(p.oldScript),p.previousSha);assert.equal(sha(p.script),p.updatedSha);
assert.doesNotThrow(()=>new AsyncFunction("scene","region","event",p.script));
assert.ok(p.script.includes("cavFreePickupRequest"));assert.ok(p.script.includes("tokenMoveIn"));
assert.ok(p.script.includes("ChatMessage.create"));assert.ok(p.script.includes("Collect"));
assert.ok(p.newEvents.includes("behaviorViewed"));assert.ok(p.newEvents.includes("behaviorUnviewed"));
assert.ok(!p.oldScript.includes("cavFreePickupRequest"));
}
});
test("Attic and Sophia originals remain gated by actual ladder/door state",()=>{
const a=M.plan.find(p=>p.region==="82gAoSwyIPu8EdQs");
const s=M.plan.find(p=>p.region==="CAVB0FDF8543F6D9");
assert.ok(a.script.includes("cavAtticLadderLowered"));assert.ok(s.script.includes("cavSophiaDoorUnlocked"));
});
test("GM authenticates real user, actor ownership, original one-time provenance and reach",()=>{
const src=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-free-pickup-click.js",import.meta.url),"utf8");
for(const key of ["message.user?.id!==senderId","testUserPermission(player,'OWNER')","testUserPermission(player,'OBSERVER')","!originalGateOpen(policy.gate)","claim?.status==='done'||claim?.status==='reserved'","await actor.createEmbeddedDocuments('Item',[item])","status:'done'"])assert.ok(src.includes(key),key);
});
test("Pure click range requires valid geometry and nearby token",()=>{
const region={shapes:[{toObject:()=>({type:"rectangle",x:100,y:100,width:220,height:220})}]},scene={grid:{size:220}};
assert.equal(isCavFreePickupNear({scene,region,token:{x:100,y:100,width:1,height:1}}),true);
assert.equal(isCavFreePickupNear({scene,region,token:{x:4000,y:4000,width:1,height:1}}),false);
assert.equal(isCavFreePickupNear({scene:{grid:{size:0}},region,token:{x:100,y:100,width:1,height:1}}),false);
});
test("Existing Regionwright bootstrap auto-arms GM service on next coordinated reload",()=>{
const src=readFileSync(new URL("../modules/regionwright/scripts/studio-campaign.js",import.meta.url),"utf8");
assert.equal(src.split("installCabinFreePickupClickGMService();").length-1,1);
assert.ok(src.indexOf("installCabin587GMService();")<src.indexOf("installCabinFreePickupClickGMService();"));
});