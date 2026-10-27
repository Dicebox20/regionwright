import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {assessCavRoofClockHands,assessCavRoofClockHandsGM} from "../modules/regionwright/scripts/studio-cav-roof-hands-proof.js";
const cfg={
 hour:{uuid:"Item.HVZnNaV2SxNWck6H",name:"Grandfather Clock Hour Hand",origin:"Scene.CAVHG06GreatRoom.Region.MrWgTyGg0d0DI53Q",claimField:"sourceUuid",id:"h1"},
 minute:{uuid:"Item.smvovibxtjJ9NW56",name:"Attic Clock Minute Hand",origin:"Scene.nyF5EX0JiEu23C3p.Region.UtXhS68vd1czWfTG",claimField:"itemUuid",id:"m1"}
};
const base=()=>({actorId:"hero",hands:Object.fromEntries(Object.entries(cfg).map(([kind,c])=>[kind,{
 regionUuid:c.origin,
 source:{uuid:c.uuid,name:c.name,type:"loot",quantity:1},
 claim:{status:"done",actorId:"hero",[c.claimField]:c.uuid,embeddedItemId:c.id},
 items:[{actorId:"hero",id:c.id,name:c.name,type:"loot",quantity:1,sourceUuid:c.uuid,originUuid:c.origin}]
}]))});
const check=o=>assessCavRoofClockHands(o);
test("Original Grandfather and Attic completed awards are required for Roof Clock noon",()=>{
 const x=check(base());assert.equal(x.ready,true);assert.equal(x.hourItemId,"h1");assert.equal(x.minuteItemId,"m1");
});
test("Reserved original Hour/Minute grants with visible Items never operate Roof Clock",()=>{
 for(const key of ["hour","minute"]){const p=base();p.hands[key].claim.status="reserved";assert.equal(check(p).ready,false);}
});
test("Original Hour or Minute missing claim and orphan item always deny",()=>{
 for(const key of ["hour","minute"]){const p=base();p.hands[key].claim=null;assert.equal(check(p).ready,false);}
});
test("Duplicate source-tagged Hand, missing Item and different claimant never qualify",()=>{
 for(const key of ["hour","minute"]){
  for(const mutate of [p=>p.hands[key].items=[],p=>p.hands[key].items.push({...p.hands[key].items[0],id:"duplicate"}),
    p=>p.hands[key].claim.actorId="other",p=>p.hands[key].claim.embeddedItemId="different",
    p=>p.hands[key].items[0].actorId="other"]){const p=base();mutate(p);assert.equal(check(p).ready,false);}
 }
});
test("Wrong original hand source, item quantity and physical Region deny",()=>{
 for(const key of ["hour","minute"]){
  for(const mutate of [p=>p.hands[key].source.uuid="Item.forged",
    p=>p.hands[key].source.quantity=0,p=>p.hands[key].regionUuid="Scene.invalid",
    p=>p.hands[key].items[0].originUuid="Scene.invalid"]){const p=base();mutate(p);assert.equal(check(p).ready,false);}
 }
});
test("GM adapter refuses non-GM or unavailable game rather than exposing award data",()=>{
 assert.deepEqual(assessCavRoofClockHandsGM({type:"character"}),{ready:false,reason:"not-elected-gm-or-character"});
});
test("Existing Roof GM listener requires authentic award BEFORE awarding Gear",()=>{
 const src=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-roof-clock.js",import.meta.url),"utf8");
 assert.match(src,/assessCavRoofClockHandsGM\(actor\)\.ready/);
 assert.ok(src.indexOf("assessCavRoofClockHandsGM(actor).ready")<src.indexOf("await region.setFlag(NS,LEDGER,"));
 assert.match(src,/cavRoofGearSourceUuid/);
 assert.match(src,/created\[0\]\.id/);
});
