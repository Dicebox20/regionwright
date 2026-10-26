import test from "node:test";
import assert from "node:assert/strict";
import {geometryEqual} from "../modules/regionwright/scripts/studio-cav-water-controller.js";
const target="Scene.CAVTRAILScene001.Region.N5LomZ7TrVBMoExk";
const makeVariant=()=>{
 const arrival={id:"R2Pg9eHODtb1C1Yk",shapes:[{toObject:()=>({type:"rectangle",x:1810,y:345,width:165,height:160})}]};
 const portal={id:"EK3UbdrVWwe28PmW",type:"teleportToken",disabled:false,system:{destinations:new Set([target])}};
 const ret={id:"SLovYxFAWVAMFzXg",shapes:[{toObject:()=>({type:"rectangle",x:1920,y:95,width:170,height:145})}],behaviors:{contents:[portal]}};
 const regions=new Map([[arrival.id,arrival],[ret.id,ret]]);
 return {width:2160,height:1440,grid:{size:120},regions,arrival,ret,portal};
};
test("Both original native Bathhouse arrival and enabled return routes must match",()=>{
 const a=makeVariant(),b=makeVariant();
 assert.equal(geometryEqual(a,b),true);
});
test("Absent or disabled return Behavior fails closed without exceptions",()=>{
 const a=makeVariant(),b=makeVariant();
 b.ret.behaviors.contents=[];
 assert.equal(geometryEqual(a,b),false);
 b.ret.behaviors.contents=[b.portal];b.portal.disabled=true;
 assert.equal(geometryEqual(a,b),false);
 b.portal.disabled=false;delete b.portal.system;
 assert.equal(geometryEqual(a,b),false);
});
test("Rejects changed return destination, wrong Behavior identity and mismatched geometry",()=>{
 const a=makeVariant(),b=makeVariant();
 b.portal.system.destinations=new Set(["Scene.CAVTRAILScene001.Region.unknown"]);assert.equal(geometryEqual(a,b),false);
 b.portal.system.destinations=new Set([target]);b.portal.id="fake-portal";assert.equal(geometryEqual(a,b),false);
 b.portal.id=a.portal.id;b.ret.shapes=[{toObject:()=>({type:"rectangle",x:1921,y:95,width:170,height:145})}];assert.equal(geometryEqual(a,b),false);
 b.ret.shapes=a.ret.shapes;b.grid.size=100;assert.equal(geometryEqual(a,b),false);
});
test("No throw on incomplete or missing native Scene/Region shape definitions",()=>{
 const a=makeVariant(),b=makeVariant();
 assert.equal(geometryEqual(null,b),false);
 b.regions.delete("SLovYxFAWVAMFzXg");assert.equal(geometryEqual(a,b),false);
});
