import test from "node:test";
import assert from "node:assert/strict";
import {readRosewaterUndergroundBeforeRefill} from "../modules/regionwright/scripts/studio-cav-water-controller.js";
const ns="dicebox-campaign-helper";
function scene(id,name,tokens=[]){
 const flags={};
 const map=new Map();
 const s={id,name,flags,tokens:{contents:tokens.map(id=>({id}))},
  getFlag:(namespace,key)=>flags[namespace]?.[key],
  regions:{contents:[],get:id=>map.get(id)}};
 s.addRegion=(id)=>{const r={id,behaviors:{contents:[]}};s.regions.contents.push(r);map.set(id,r);return r};
 s.setFlag=(key,value)=>{(flags[ns]??={})[key]=value};
 return s;
}
function link(from,to,kind,regionId){
 const r=from.regions.contents[0]??from.addRegion("from-region");
 r.behaviors.contents.push({
  type:"teleportToken",disabled:false,
  getFlag:(namespace,key)=>namespace===ns&&key==="cavRosewaterRouteKind"?kind:null,
  system:{destinations:new Set(["Scene."+to.id+".Region."+regionId])}
 });
}
function inspect(scenes){
 const previous=globalThis.game;
 globalThis.game={scenes:{contents:scenes,get:id=>scenes.find(s=>s.id===id)}};
 try{return readRosewaterUndergroundBeforeRefill()}
 finally{globalThis.game=previous}
}
test("An unbuilt BATH-03/BATH-04 pair has no effect on existing Sluice",()=>{
 assert.deepEqual(inspect([]),{ok:true,reason:"no-underground-rooms-installed"});
});
test("Partially constructed or duplicated named scenes fail closed",()=>{
 const a=scene("reliq","BATH-04 - Rosewater Reliquary");
 assert.equal(inspect([a]).reason,"partial-or-duplicate-underground-room");
 assert.equal(inspect([a,scene("boil","BATH-03 - Boiler"),scene("boil2","Boiler Room")]).ok,false);
});
test("Occupied BATH-04 cannot be stranded behind unlocked-looking but uncertified destinations",()=>{
 const a=scene("reliq","BATH-04 - Rosewater Reliquary",["pc1"]),b=scene("boil","BATH-03 - Boiler");
 a.addRegion("ra");b.addRegion("rb");
 assert.equal(inspect([a,b]).reason,"occupied-underground-egress-unverified");
 link(a,b,"reliquary-to-boiler","rb");link(b,a,"boiler-to-reliquary","ra");
 assert.equal(inspect([a,b]).reason,"occupied-underground-egress-unverified");
});
test("Native reciprocal dry service and explicit verified estate exit permit safe occupancy",()=>{
 const a=scene("reliq","BATH-04 - Rosewater Reliquary",["pc1"]),b=scene("boil","BATH-03 - Boiler"),out=scene("estate","H-G09 - Rear Family Room");
 a.addRegion("ra");b.addRegion("rb");out.addRegion("ro");
 link(a,b,"reliquary-to-boiler","rb");link(b,a,"boiler-to-reliquary","ra");
 b.setFlag("cavBoilerEstateExitCertificate",{status:"done",pressureIndependent:true,
  destinationSceneId:"estate",destinationRegionId:"ro"});
 assert.equal(inspect([a,b,out]).ok,false); // Certificate alone is insufficient.
 link(b,out,"boiler-to-estate","ro");
 assert.equal(inspect([a,b,out]).reason,"occupied-with-certified-dry-egress");
 b.regions.contents[0].behaviors.contents.find(x=>x.getFlag(ns,"cavRosewaterRouteKind")==="boiler-to-estate").disabled=true;
 assert.equal(inspect([a,b,out]).ok,false);
});
