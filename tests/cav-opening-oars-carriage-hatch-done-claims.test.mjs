import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {patchCavRowboat,patchCavCarriage,patchCavAtticHatch,shaCavNative,SHA_OARS_ROWBOAT,SHA_CARRIAGE,SHA_ATTIC_HATCH} from "../modules/regionwright/scripts/studio-cav-opening-triple-claim-proof.js";
const root=new URL("../docs/cabin-ashen-veil/native-source-snapshots/",import.meta.url);
const originals=Object.fromEntries(["rowboat","carriage","hatch"].map(k=>[k,readFileSync(new URL("cav-"+k+"-original-20261026.js.txt",root),"utf8")]));
const patches={rowboat:patchCavRowboat,carriage:patchCavCarriage,hatch:patchCavAtticHatch};
const native=Object.fromEntries(Object.keys(patches).map(k=>[k,patches[k](originals[k])]));
const scope="dicebox-campaign-helper";
function excerpt(source,from,to){
 const a=source.indexOf(from),b=source.indexOf(to,a);
 assert.ok(a>=0&&b>a,"Expected native award proof boundary: "+from);
 return source.slice(a,b);
}
const oarsFn=new Function("actor","game","SCOPE",excerpt(native.rowboat,"const oarsRegion=","if (!ownsOars) return;")+"\nreturn ownsOars;");
const carriageFn=new Function("actor","game","SCOPE","ITEM_KEY","VANITY",excerpt(native.carriage,"const vanityRegion=","if (!keyPresent) return;")+"\nreturn keyPresent;");
const hatchFn=new Function("actor","game","SCOPE","HOOK","SOURCE",excerpt(native.hatch,"const carriageRegion=","if(!genuine)return;")+"\nreturn genuine;");
const OARS="Item.CAVOARSPOND00001",OR="Scene.CAVEXT01Yard0001.Region.CAV01R0000000006",VANITY="Scene.CAVHU07Scene0001.Region.CAVVANITYREG0001",
 CARRIAGE="Scene.CAVEXT01Yard0001.Region.CAV01R0000000008",KEY="Item.CAVCARRIAGEKEY01",HOOK="Item.CAVLADDERHOOK001";
function fixture(kind){
 const config={
 rowboat:{scene:"CAVEXT01Yard0001",region:"CAV01R0000000006",uuid:OR,ledger:"cavOarsPickup",claim:{status:"done",actorId:"hero",sourceUuid:OARS,itemId:"oars1"},
 item:{id:"oars1",name:"Wooden Oars",flags:{cavPickupSourceUuid:OARS,cavPickupRegionUuid:OR}}},
 carriage:{scene:"CAVHU07Scene0001",region:"CAVVANITYREG0001",uuid:VANITY,ledger:"cavVanityKeysClaim",
 claim:{status:"done",actorId:"hero",mirrorUuid:"Item.CAVMIRRORSUNK001",rewardUuids:["Item.CAVBRASSKEYVAN01",KEY],embeddedItemIds:["brass1","carriage1"]},
 item:{id:"carriage1",name:"Carriage Key",flags:{cavVanityRewardSourceUuid:KEY,cavVanityRewardRegionUuid:VANITY}}},
 hatch:{scene:"CAVEXT01Yard0001",region:"CAV01R0000000008",uuid:CARRIAGE,ledger:"cavFamilyCarriageHookClaim",
 claim:{status:"done",actorId:"hero",sourceUuid:HOOK,embeddedItemId:"hook1"},
 item:{id:"hook1",name:"Ladder Hook",flags:{cavCarriageRewardSourceUuid:HOOK,cavCarriageRewardRegionUuid:CARRIAGE}}}
 }[kind];
 const {item,claim}=config;
 item.getFlag=function(s,key){return s===scope?this.flags[key]:null};
 const actor={id:"hero",items:{contents:[item]}};
 const region={uuid:config.uuid,getFlag(s,key){return s===scope&&key===config.ledger?config.claim:null}};
 const game={scenes:new Map([[config.scene,{regions:new Map([[config.region,region]])}]])};
 const fn={rowboat:()=>oarsFn(actor,game,scope),carriage:()=>carriageFn(actor,game,scope,KEY,VANITY),hatch:()=>hatchFn(actor,game,scope,HOOK,CARRIAGE)}[kind];
 return {config,item,claim,actor,region,game,check:fn};
}
test("Three SHA-pinned exact native source identities",()=>{
 assert.equal(shaCavNative(originals.rowboat),SHA_OARS_ROWBOAT);
 assert.equal(shaCavNative(originals.carriage),SHA_CARRIAGE);
 assert.equal(shaCavNative(originals.hatch),SHA_ATTIC_HATCH);
});
test("All three modified native bodies compile in Foundry async RegionBehavior scope",()=>{
 const AsyncFunction=Object.getPrototypeOf(async function(){}).constructor;
 for(const [kind,script]of Object.entries(native))
  assert.doesNotThrow(()=>new AsyncFunction("scene","region","event",script),kind);
});
test("Original reward/region operations and token player ownership checks are preserved",()=>{
 for(const kind of Object.keys(native)){
  const count=(str,re)=>(str.match(re)||[]).length;
  assert.equal(count(native[kind],/await region\.setFlag\(/g),count(originals[kind],/await region\.setFlag\(/g));
  assert.equal(count(native[kind],/createEmbeddedDocuments\(/g),count(originals[kind],/createEmbeddedDocuments\(/g));
  assert.equal(count(native[kind],/ChatMessage\.create\(/g),count(originals[kind],/ChatMessage\.create\(/g));
  assert.equal(count(native[kind],/tokenMoveIn/g),count(originals[kind],/tokenMoveIn/g));
 }
});
for(const kind of ["rowboat","carriage","hatch"]){
 test(kind+" accepts exact original completed award with matching character and Item",()=>{
  const f=fixture(kind);assert.equal(f.check(),true);
 });
 test(kind+" refuses reserved, partial, failed and missing original claims",()=>{
  for(const status of ["reserved","pending","staged","failed",null]){const f=fixture(kind);f.claim.status=status;assert.equal(f.check(),false,String(status))}
 });
 test(kind+" refuses forged claimant, orphan Item ID and invalid Region",()=>{
  const mods=[
   f=>f.claim.actorId="other",
   f=>f.item.id="forged",
   f=>f.item.name="wrong item",
   f=>f.region.uuid="Scene.invalid",
   f=>f.actor.items.contents.push({...f.item})
  ];
  for(const mutate of mods){const f=fixture(kind);mutate(f);assert.equal(f.check(),false)}
 });
 test(kind+" refuses wrong original award and tagged duplicate",()=>{
  const f=fixture(kind);
  if(kind==="rowboat")f.claim.sourceUuid="Item.madeup";
  if(kind==="carriage")f.claim.rewardUuids[1]="Item.madeup";
  if(kind==="hatch")f.claim.sourceUuid="Item.madeup";
  assert.equal(f.check(),false);
 });
}
test("Carriage requires complete two-key Vanity transaction and exact second embedded ID",()=>{
 for(const mutate of [
 f=>f.claim.rewardUuids.reverse(),f=>f.claim.embeddedItemIds.reverse(),
 f=>f.claim.embeddedItemIds=["carriage1","carriage1"],f=>f.claim.rewardUuids=[],
 f=>f.claim.mirrorUuid="Item.bad",f=>f.item.flags.cavVanityRewardRegionUuid="Scene.fake"]){
 const f=fixture("carriage");mutate(f);assert.equal(f.check(),false);
 }
});
test("Original Oars DONE claim from live Foundry remains compatible",()=>{
 const f=fixture("rowboat");
 assert.equal(f.check(),true);
 assert.ok(native.rowboat.includes("cavOarsPickup"));
});
test("Attic hatch still requires both original return and entry teleports and preserves return-first switch",()=>{
 const src=native.hatch;
 for(const text of ["entry.system.destinations","back.system.destinations","!entry.disabled||!back.disabled",
  "returnRegion.updateEmbeddedDocuments","region.updateEmbeddedDocuments","cavAtticLadderLowered"])
 assert.ok(src.includes(text),text);
 assert.ok(src.indexOf("returnRegion.updateEmbeddedDocuments")<src.indexOf("region.updateEmbeddedDocuments"));
});
test("Mismatch and already patched source reliably fail closed",()=>{
 for(const kind of Object.keys(native)){
  assert.throws(()=>patches[kind](originals[kind]+"\n// unexpected"),/STOP/);
  assert.throws(()=>patches[kind](native[kind]),/STOP/);
 }
});
