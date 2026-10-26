import test from "node:test";import assert from "node:assert/strict";
import {isSluiceCharacterNearControl} from "../modules/regionwright/scripts/studio-cav-sluice.js";
const shape={type:"rectangle",x:1843,y:2655,width:435,height:325};
const region={shapes:[{toObject:()=>shape}]},scene={grid:{size:120}};
const control={x:2060.5,y:2817.5};
const tokenAt=(x,y)=>({x:x-60,y:y-60,width:1,height:1});
test("Original Sluice center and 400-pixel reach are valid; beyond 400 is denied",()=>{
 assert.equal(isSluiceCharacterNearControl({token:tokenAt(control.x,control.y),scene,region}),true);
 assert.equal(isSluiceCharacterNearControl({token:tokenAt(control.x+400,control.y),scene,region}),true);
 assert.equal(isSluiceCharacterNearControl({token:tokenAt(control.x+400.01,control.y),scene,region}),false);
});
test("Remote token or invalid coordinates cannot operate original Sluice",()=>{
 assert.equal(isSluiceCharacterNearControl({token:tokenAt(910,1970),scene,region}),false);
 assert.equal(isSluiceCharacterNearControl({token:null,scene,region}),false);
 assert.equal(isSluiceCharacterNearControl({token:{x:NaN,y:2,width:1,height:1},scene,region}),false);
 assert.equal(isSluiceCharacterNearControl({token:tokenAt(control.x,control.y),scene:{grid:{size:0}},region}),false);
});
test("Malformed or missing native Region shapes fail closed",()=>{
 assert.equal(isSluiceCharacterNearControl({token:tokenAt(control.x,control.y),scene,region:{shapes:[]}}),false);
 assert.equal(isSluiceCharacterNearControl({token:tokenAt(control.x,control.y),scene,region:{shapes:[{toObject:()=>({...shape,width:0})}]}}),false);
 assert.equal(isSluiceCharacterNearControl({token:tokenAt(control.x,control.y),scene,region:{shapes:[{toObject:()=>({...shape,type:"polygon"})}]}}),false);
});
test("Nearby Pond shore characters may interact without standing inside small mechanical control Region",()=>{
 const selected=tokenAt(1843-10,2655+100);
 assert.equal(isSluiceCharacterNearControl({token:selected,scene,region}),true);
});
