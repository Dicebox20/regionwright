import test from "node:test";
import assert from "node:assert/strict";
import{readFileSync}from"node:fs";
import{createHash}from"node:crypto";
const P=JSON.parse(readFileSync(new URL("../docs/cabin-ashen-veil/cav-owner-approved-oars-shack-interior-migration-payload-2026-10-27.json",import.meta.url),"utf8"));
const sha=s=>createHash("sha256").update(s).digest("hex");
const ns="dicebox-campaign-helper",historic="Scene.CAVEXT01Yard0001.Region.CAV01R0000000006",newUuid="Scene.CAVEXT03Scene001.Region.TWKOyz83JjJu94E7",source="Item.CAVOARSPOND00001";
const s=P.newRowboatSource,st=s.indexOf("const oarsRegion="),end=s.indexOf("if (!ownsOars) return;",st);
assert.ok(st>=0&&end>st);
const check=new Function("actor","game","SCOPE",s.slice(st,end)+"return ownsOars;");
function fixture({legacy=true,legacyClaim=true,migrated=true,itemSource=source,newClaim=true,actorId="skaal",additionalItem=false}={}){
 const carried={...P.claimCarryForward,actorId,sourceUuid:source,itemId:"oar1"};
 if(!migrated)delete carried.migratedFromRegionUuid;
 const oldClaim=legacyClaim?{status:"done",actorId,sourceUuid:source,itemId:"oar1"}:null;
 const oldRegion={uuid:historic,getFlag(s,k){return s===ns&&k==="cavOarsPickup"?oldClaim:null}};
 const newRegion={uuid:newUuid,getFlag(s,k){return s===ns&&k==="cavOarsPickup"&&newClaim?carried:null}};
 const item={id:"oar1",name:"Wooden Oars",getFlag(s,k){return s===ns?({
  cavPickupSourceUuid:itemSource,cavPickupRegionUuid:legacy?historic:newUuid})[k]:null}};
 const actor={id:actorId,items:{contents:[item,...(additionalItem?[item]:[])]}};
 const scenes=new Map([["CAVEXT01Yard0001",{regions:new Map([["CAV01R0000000006",oldRegion]])}],
 ["CAVEXT03Scene001",{regions:new Map([["TWKOyz83JjJu94E7",newRegion]])}]]);
 return{actor,game:{scenes},carried,item,oldRegion,newRegion};
}
test("Prepared original and new native Behavior sources are exact immutable checksum identities",()=>{
 assert.equal(P.from.scene,"CAVEXT01Yard0001");
 assert.equal(P.to.scene,"CAVEXT03Scene001");
 assert.equal(P.to.region,"TWKOyz83JjJu94E7");
 assert.equal(sha(P.newOarsSource),P.to.newSourceSha);
 assert.equal(sha(P.newRowboatSource),P.rowboat.newSourceSha);
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 assert.doesNotThrow(()=>new AsyncFunction("scene","region","event",P.newOarsSource));
 assert.doesNotThrow(()=>new AsyncFunction("scene","region","event",P.newRowboatSource));
});
test("The relocated Shack oars pickup does not duplicate any prior authentic source Item",()=>{
 const txt=P.newOarsSource;
 assert.ok(txt.includes("const SCENE='CAVEXT03Scene001';"));
 assert.ok(txt.includes("const REGION='TWKOyz83JjJu94E7';"));
 assert.ok(txt.includes("if (claim?.status==='done' || claim?.status==='reserved') return;"));
 assert.ok(txt.includes("const hasReward=game.actors.contents.some"));
 assert.ok(txt.includes("i.getFlag?.(SCOPE,'cavPickupSourceUuid')===source.uuid"));
 assert.ok(!txt.includes("Bring the character"));
});
test("Historical Skaal Tel DONE receipt remains exactly compatible with migrated Shack Claim",()=>{
 const f=fixture();assert.equal(check(f.actor,f.game,ns),true);
 assert.equal(P.originalActorItem.regionFlag,historic);
 assert.equal(P.claimCarryForward.migratedFromRegionUuid,historic);
 assert.equal(P.claimCarryForward.status,"done");
});
test("Genuine NEW Shack pickup is accepted with new Region provenance",()=>{
 const f=fixture({legacy:false,legacyClaim:false});assert.equal(check(f.actor,f.game,ns),true);
});
test("Forgery and loose item tags alone cannot bypass the Rowboat mirror gate",()=>{
 for(const change of [
 {newClaim:false},{migrated:false},{legacyClaim:false},{itemSource:"Item.fake"},
 {additionalItem:true}]){
  const f=fixture(change);assert.equal(check(f.actor,f.game,ns),false,JSON.stringify(change))
 }
 const f=fixture();f.carried.status="reserved";assert.equal(check(f.actor,f.game,ns),false);
 f.carried.status="done";f.carried.itemId="mismatched";assert.equal(check(f.actor,f.game,ns),false);
});
test("Rowboat's original mirror reward logic and one-time grant are not modified",()=>{
 assert.equal((P.newRowboatSource.match(/await region\.setFlag\(/g)||[]).length,2);
 assert.equal((P.newRowboatSource.match(/createEmbeddedDocuments\('Item'/g)||[]).length,1);
 assert.equal((P.newRowboatSource.match(/ChatMessage\.create\(/g)||[]).length,1);
 assert.equal((P.newRowboatSource.match(/tokenMoveIn/g)||[]).length,1);
 assert.ok(P.newRowboatSource.includes("const ITEM_ID='CAVMIRRORSUNK001';"));
 assert.ok(P.newRowboatSource.includes("const STATE_KEY='cavPondMirrorPickup';"));
});