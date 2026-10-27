import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {isCav587CharacterNearRegion} from "../modules/regionwright/scripts/studio-cav-587.js";
const scene={grid:{size:120}},rect={type:"rectangle",x:640,y:360,width:235,height:210};
const region={shapes:[{toObject:()=>({...rect})}]};
const token=(x,y)=>({x:x-60,y:y-60,width:1,height:1});
const cx=rect.x+rect.width/2,cy=rect.y+rect.height/2;
test("Original 587 desk center and inclusive 400px are eligible, farther character denied",()=>{
 assert.equal(isCav587CharacterNearRegion({token:token(cx,cy),scene,region}),true);
 assert.equal(isCav587CharacterNearRegion({token:token(cx+400,cy),scene,region}),true);
 assert.equal(isCav587CharacterNearRegion({token:token(cx+400.001,cy),scene,region}),false);
});
test("Original 587 GM rejects malformed NaN/Infinity/zero-size Region geometry",()=>{
 for(const invalid of [{x:NaN},{x:Infinity},{width:0},{height:-1},{type:"polygon"},{y:undefined}])
  assert.equal(isCav587CharacterNearRegion({token:token(cx,cy),scene,region:{shapes:[{toObject:()=>({...rect,...invalid})}]}}),false);
});
test("Original 587 GM refuses invalid selected token, missing shape, or bad grid",()=>{
 assert.equal(isCav587CharacterNearRegion({token:null,scene,region}),false);
 assert.equal(isCav587CharacterNearRegion({token:{x:Infinity,y:1,width:1,height:1},scene,region}),false);
 assert.equal(isCav587CharacterNearRegion({token:token(cx,cy),scene:{grid:{size:0}},region}),false);
 assert.equal(isCav587CharacterNearRegion({token:token(cx,cy),scene,region:{shapes:[]}}),false);
});
test("GM preserves actual sender/character/source/door/once-only checks and shared spatial rule",()=>{
 const src=readFileSync(new URL("../modules/regionwright/scripts/studio-cav-587.js",import.meta.url),"utf8");
 for(const text of ["message.user","senderId","actor.testUserPermission(player,'OWNER')",
                      "request.sceneId!==sceneId","isCav587CharacterNearRegion({token,scene,region:r})",
                      "cavDonovan587LockboxClaim","const digits=request.digits"])
  assert.ok(src.includes(text),text);
});
