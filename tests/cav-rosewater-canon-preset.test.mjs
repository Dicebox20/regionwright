import test from "node:test";
import assert from "node:assert/strict";
import {ROSEWATER_RING_ANGLES_DEGREES,ROSEWATER_RING_QUARTER_TURNS,createRosewaterCampaignConfig,evaluateRosewaterCampaignSolution,rotateRosewaterRing,resetRosewaterRings} from "../modules/regionwright-puzzles-locks/scripts/rosewater-campaign-preset.js";
test("canon exactly 90, 270, 180 degrees with quarter-turn ring geometry",()=>{
 assert.deepEqual(ROSEWATER_RING_ANGLES_DEGREES,[90,270,180]);
 assert.deepEqual(ROSEWATER_RING_QUARTER_TURNS,[1,3,2]);
 assert.deepEqual(ROSEWATER_RING_QUARTER_TURNS.map(n=>n*90),ROSEWATER_RING_ANGLES_DEGREES);
});
test("owner-approved art symbols mandatory, no six-position demo defaults",()=>{
 assert.throws(()=>createRosewaterCampaignConfig(),/four approved/);
 assert.throws(()=>createRosewaterCampaignConfig({symbols:["moth","rose","key","moon","sun","thorn"]}),/four approved/);
 const c=createRosewaterCampaignConfig({symbols:["mark-zero","mark-one","mark-two","mark-three"]});
 assert.deepEqual(c.solution,[1,3,2]);
 assert.equal(c.symbols.length,4);
 assert.throws(()=>createRosewaterCampaignConfig({symbols:["x","x","y","z"]}),/Invalid unique/);
});
test("only exact campaign quarter positions solve, incorrect press fails",()=>{
 const c=createRosewaterCampaignConfig({symbols:["mark-zero","mark-one","mark-two","mark-three"]});
 let s=resetRosewaterRings(c);assert.equal(evaluateRosewaterCampaignSolution(c,s).success,false);
 for(const [ring,count] of [["outer",1],["middle",3],["inner",2]]){
  for(let i=0;i<count;i++)s=rotateRosewaterRing(c,s,ring);
 }
 assert.equal(evaluateRosewaterCampaignSolution(c,s).success,true);
 assert.deepEqual(s.positions,[1,3,2]);
 assert.equal(evaluateRosewaterCampaignSolution(c,{positions:[1,3,1]}).success,false);
});
test("canonical preset rejects modified three-ring targets before validation",()=>{
 const c=createRosewaterCampaignConfig({symbols:["mark-zero","mark-one","mark-two","mark-three"]});
 assert.throws(()=>evaluateRosewaterCampaignSolution({...c,solution:[1,3,5]},{positions:[1,3,2]}),/does not match/);
 assert.throws(()=>evaluateRosewaterCampaignSolution({...c,solution:[1,2,3]},{positions:[1,2,3]}),/does not match/);
});
