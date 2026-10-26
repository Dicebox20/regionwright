import test from"node:test";import assert from"node:assert/strict";
import{createCavBoilerConfig,evaluateCavBoiler,adjustCavBoiler,resetCavBoiler}from"../modules/regionwright-puzzles-locks/scripts/cav-boiler-campaign-preset.js";
import{createWaterworksPressureConfig}from"../modules/regionwright-puzzles-locks/scripts/waterworks-pressure-engine.js";
test("CAV Boiler 2/1 is distinct from standalone test 2/4",()=>{
 const c=createCavBoilerConfig();assert.deepEqual(c.valves.map(x=>x.target),[2,1]);
 assert.deepEqual(createWaterworksPressureConfig({variant:"boiler"}).valves.map(x=>x.target),[2,4]);
});
test("CAV Boiler accepts 2/1 but not 2/4, requires both valves",()=>{
 const c=createCavBoilerConfig();let s=resetCavBoiler(c);
 for(let i=0;i<2;i++)s=adjustCavBoiler(c,s,"left",1);
 s=adjustCavBoiler(c,s,"right",1);assert.equal(evaluateCavBoiler(c,s).success,true);
 s=adjustCavBoiler(c,s,"right",1);assert.equal(evaluateCavBoiler(c,s).success,false);
 assert.throws(()=>evaluateCavBoiler(createWaterworksPressureConfig({variant:"boiler"}),s),/2\/1/);
});
