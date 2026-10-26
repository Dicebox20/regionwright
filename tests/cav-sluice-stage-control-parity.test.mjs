import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isSluiceCharacterNearControl,isSluiceStageTokenAtControl} from "../modules/regionwright/scripts/studio-cav-sluice.js";
const rect={type:"rectangle",x:1843,y:2655,width:435,height:325};
const region={shapes:[{toObject:()=>rect}],testPoint:({x,y,elevation})=>elevation===0&&x>=rect.x&&x<=rect.x+rect.width&&y>=rect.y&&y<=rect.y+rect.height};
const scene={grid:{size:120}};
const tokenAt=(x,y)=>({x:x-60,y:y-60,width:1,height:1});
test("Fitting at the outer 400px reach is allowed but operating outside native hotspot is not",()=>{
 const t=tokenAt(rect.x-10,rect.y+rect.height/2);
 assert.equal(isSluiceCharacterNearControl({token:t,scene,region}),true);
 assert.equal(isSluiceStageTokenAtControl({token:t,scene,region}),false);
});
test("Water stage operator inside the original native Sluice Region is accepted",()=>{
 const t=tokenAt(rect.x+rect.width/2,rect.y+rect.height/2);
 assert.equal(isSluiceStageTokenAtControl({token:t,scene,region}),true);
});
test("Malformed Region, native point rejection, distant and uninitialized tokens fail closed",()=>{
 const t=tokenAt(rect.x+rect.width/2,rect.y+rect.height/2);
 assert.equal(isSluiceStageTokenAtControl({token:t,scene,region:{...region,testPoint:undefined}}),false);
 assert.equal(isSluiceStageTokenAtControl({token:t,scene,region:{...region,testPoint:()=>false}}),false);
 assert.equal(isSluiceStageTokenAtControl({token:tokenAt(100,100),scene,region}),false);
 assert.equal(isSluiceStageTokenAtControl({token:null,scene,region}),false);
});
test("GM authorization and Pond-safe list use exact same stage predicate as player UI",()=>{
 const root=new URL("../modules/regionwright/scripts/",import.meta.url);
 const controller=readFileSync(new URL("studio-cav-water-controller.js",root),"utf8");
 const sluice=readFileSync(new URL("studio-cav-sluice.js",root),"utf8");
 assert.match(controller,/!isSluiceStageTokenAtControl\(\{token,scene:pond,region\}\)/);
 assert.match(controller,/safePond=allPond\.filter\(t=>!t\.hidden&&isSluiceStageTokenAtControl\(\{token:t,scene:pond,region\}\)\)/);
 assert.match(sluice,/stageAction=installed&&safelyConfigured&&!busy&&atStageControls\?/);
});
