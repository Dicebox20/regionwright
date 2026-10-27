import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {patchCavVanity,patchCavHour,ORIGINAL_VANITY_SHA,ORIGINAL_HOUR_SHA,sourceSha} from "../modules/regionwright/scripts/studio-cav-first-act-receipt-parity.js";

const load=name=>readFileSync(new URL("../docs/cabin-ashen-veil/native-source-snapshots/cav-"+name+"-original-20261026.js.txt",import.meta.url),"utf8");
const oldVanity=load("vanity"),oldHour=load("hour");
const vanity=patchCavVanity(oldVanity),hour=patchCavHour(oldHour);
const extract=(script,start,stop)=>{const a=script.indexOf(start),b=script.indexOf(stop,a);assert.ok(a>=0&&b>a,"native proof anchors must exist");return script.slice(a,b)};
const vanityEvaluate=new Function("actor","game","SCOPE","MIRROR",extract(vanity,"const mirrorRegion=","if (!hasMirror) return;")+"\nreturn hasMirror;");
const hourEvaluate=new Function("actor","game","SCOPE","KEY","VANITY",extract(hour,"const vanityRegion=","if(!genuine)return;")+"\nreturn genuine;");
const scope="dicebox-campaign-helper",mirrorUuid="Item.CAVMIRRORSUNK001",vanityUuid="Scene.CAVHU07Scene0001.Region.CAVVANITYREG0001",
 mirrorRegionUuid="Scene.CAVEXT02Scene001.Region.CAVROWBOATREG001",brassUuid="Item.CAVBRASSKEYVAN01";
function mirrorFixture(){
 const item={id:"mirror1",name:"Ornate Mirror",flags:{cavPickupSourceUuid:mirrorUuid,cavPickupRegionUuid:mirrorRegionUuid},
  getFlag(s,k){return s===scope?this.flags[k]:null}};
 const actor={id:"hero",items:{contents:[item]}};
 const claim={status:"done",actorId:"hero",sourceUuid:mirrorUuid,itemId:"mirror1"};
 const r={uuid:mirrorRegionUuid,getFlag(s,k){return s===scope&&k==="cavPondMirrorPickup"?claim:null}};
 const game={scenes:new Map([["CAVEXT02Scene001",{regions:new Map([["CAVROWBOATREG001",r]])}]])};
 return {item,actor,claim,r,game,check:()=>vanityEvaluate(actor,game,scope,mirrorUuid)};
}
function hourFixture(){
 const item={id:"brass1",name:"Brass Tiny Key #1",flags:{cavVanityRewardSourceUuid:brassUuid,cavVanityRewardRegionUuid:vanityUuid},getFlag(s,k){return s===scope?this.flags[k]:null}};
 const actor={id:"hero",items:{contents:[item]}};
 const claim={status:"done",actorId:"hero",mirrorUuid,rewardUuids:[brassUuid,"Item.CAVCARRIAGEKEY01"],embeddedItemIds:["brass1","carriage1"]};
 const r={uuid:vanityUuid,getFlag(s,k){return s===scope&&k==="cavVanityKeysClaim"?claim:null}};
 const game={scenes:new Map([["CAVHU07Scene0001",{regions:new Map([["CAVVANITYREG0001",r]])}]])};
 return {item,actor,claim,r,game,check:()=>hourEvaluate(actor,game,scope,brassUuid,vanityUuid)};
}
test("Original rowboat-derived native Vanity source is pinned",()=>assert.equal(sourceSha(oldVanity),ORIGINAL_VANITY_SHA));
test("Original Vanity-derived native Grandfather Hour source is pinned",()=>assert.equal(sourceSha(oldHour),ORIGINAL_HOUR_SHA));
test("Both patches preserve valid native asynchronous Foundry grammar",()=>{
 const AF=Object.getPrototypeOf(async function(){}).constructor;
 for(const s of [vanity,hour])assert.doesNotThrow(()=>new AF("scene","region","event",s));
});
test("Unchanged native reward implementation preserved, no synthetic claim writes",()=>{
 for(const [src,patched] of [[oldVanity,vanity],[oldHour,hour]]){
  assert.equal((patched.match(/await region\.setFlag\(/g)||[]).length,(src.match(/await region\.setFlag\(/g)||[]).length);
  assert.equal((patched.match(/createEmbeddedDocuments\(/g)||[]).length,(src.match(/createEmbeddedDocuments\(/g)||[]).length);
  assert.equal((patched.match(/ChatMessage\.create\(/g)||[]).length,(src.match(/ChatMessage\.create\(/g)||[]).length);
 }
});
test("Vanity accepts original Rowboat mirror once true DONE receipt and exact Actor Item agree",()=>assert.equal(mirrorFixture().check(),true));
test("Vanity refuses reserved, missing and otherwise invalid Rowboat transaction state",()=>{
 for(const status of ["reserved","staged","pending","failed",""]){const f=mirrorFixture();f.claim.status=status;assert.equal(f.check(),false,status)}
 const f=mirrorFixture();f.claim.itemId="";assert.equal(f.check(),false);
});
test("Vanity refuses wrong Actor, item ID, original source and wrong physical Rowboat region",()=>{
 const changes=[f=>f.claim.actorId="other",f=>f.claim.itemId="orphan",f=>f.claim.sourceUuid="Item.fake",f=>f.item.id="bad",f=>f.item.name="not-mirror",f=>f.item.flags.cavPickupRegionUuid="Scene.fake",f=>f.r.uuid="Scene.fake"];
 for(const fn of changes){const f=mirrorFixture();fn(f);assert.equal(f.check(),false);}
});
test("Vanity refuses duplicate tagged Mirror item with same ID",()=>{
 const f=mirrorFixture();f.actor.items.contents.push({...f.item});assert.equal(f.check(),false);
});
test("Hour Hand accepts completed authentic two-key Vanity grant and original embedded Brass Key",()=>assert.equal(hourFixture().check(),true));
test("Hour Hand refuses reserved, incomplete, duplicated and wrong-order Vanity key records",()=>{
 const changes=[f=>f.claim.status="reserved",f=>f.claim.status="pending",f=>f.claim.embeddedItemIds=[],f=>f.claim.embeddedItemIds=["brass1","brass1"],f=>f.claim.rewardUuids=[brassUuid],f=>f.claim.rewardUuids=["Item.CAVCARRIAGEKEY01",brassUuid]];
 for(const fn of changes){const f=hourFixture();fn(f);assert.equal(f.check(),false);}
});
test("Hour Hand refuses Item merely tagged when underlying original Vanity DONE claim fails",()=>{
 const changes=[f=>f.claim.actorId="other",f=>f.claim.mirrorUuid="Item.fake",f=>f.claim.embeddedItemIds[0]="bad",f=>f.claim.rewardUuids[1]="Item.fake",f=>f.r.uuid="Scene.fake",f=>f.item.id="other",f=>f.item.name="Fake Brass Key",f=>f.item.flags.cavVanityRewardRegionUuid="Scene.fake"];
 for(const fn of changes){const f=hourFixture();fn(f);assert.equal(f.check(),false);}
});
test("Hour Hand permits Carriage Key to be consumed; only completed original paired award is required",()=>{
 const f=hourFixture();assert.equal(f.actor.items.contents.length,1);assert.equal(f.check(),true);
});
test("Fail closed on unexpected already-mutated or nonmatching original installed native source",()=>{
 for(const [patch,old] of [[patchCavVanity,oldVanity],[patchCavHour,oldHour]]){
  assert.throws(()=>patch(old+"\n// changed"),/SHA/);
  assert.throws(()=>patch(patch(old)),/SHA/);
  assert.throws(()=>patch(""),/SHA/);
 }
});
