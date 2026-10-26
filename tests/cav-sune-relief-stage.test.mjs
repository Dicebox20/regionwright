import test from "node:test";
import assert from "node:assert/strict";
import {suneReliefStage,suneReliefSourceIds} from "../modules/regionwright/scripts/studio-cav-sune-relief.js";
test("Sune relief is hidden until four corner busts are complete",()=>{
 assert.equal(suneReliefStage(false,"locked",false,false),"hidden");
});
test("Solved busts reveal interactive puzzle but no treasure yet",()=>{
 assert.equal(suneReliefStage(true,"locked",false,false),"puzzle");
});
test("Separate claims require the bag first, then Brass Study Key",()=>{
 assert.equal(suneReliefStage(true,"solved",false,false),"gold");
 assert.equal(suneReliefStage(true,"solved",true,false),"key");
 assert.equal(suneReliefStage(true,"solved",true,true),"complete");
});
test("Immutable exact source identities",()=>{
 assert.equal(suneReliefSourceIds.bag,"CAVSUNEGPBAG0001");
 assert.equal(suneReliefSourceIds.key,"CAVSTUDYBRASS001");
 assert.equal(suneReliefSourceIds.region,"L15BdSqcbCOLPnIN");
});

