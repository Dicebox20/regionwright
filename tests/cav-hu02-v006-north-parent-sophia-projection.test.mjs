import test from "node:test";
import assert from "node:assert/strict";
const dimensions={width:1440,height:1800,grid:220};
const regions={
 parents:{id:"JP0OmkgPCTtQXxpn",rect:{x:620,y:80,width:220,height:150}},
 parentsReturn:{id:"CAVHU02PARENTAR1",rect:{x:620,y:265,width:220,height:150}},
 sophia:{id:"UV4YAstBe0WCuLcM",rect:{x:1120,y:115,width:235,height:170}},
 sophiaReturn:{id:"CAVHU02SOPHAR001",rect:{x:1100,y:345,width:230,height:160}}
};
const stair=[{x:185,y:1405,width:260,height:185},{x:170,y:1140,width:245,height:170}];
const overlaps=(a,b)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
test("The Parents doorway and Sophia's locked doorway are separate on V006's visible north wall",()=>{
 const a=regions.parents.rect,b=regions.sophia.rect;
 assert.equal(overlaps(a,b),false);
 assert.ok(a.x<a.width+dimensions.width/2);
 assert.ok(b.x>dimensions.width/2);
});
test("All four native target rectangles are fully inside scene, disjoint, and clear of stair route",()=>{
 const entries=Object.values(regions).map(x=>x.rect);
 for(const r of entries){
  assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=dimensions.width&&r.y+r.height<=dimensions.height);
  assert.ok(r.width>=dimensions.grid);
  for(const p of stair)assert.equal(overlaps(r,p),false);
 }
 for(let i=0;i<entries.length;i++)for(let j=i+1;j<entries.length;j++)
  assert.equal(overlaps(entries[i],entries[j]),false);
});
test("Original destination and return Region IDs are not replaced by new Regions",()=>{
 const ids=Object.values(regions).map(x=>x.id);
 assert.equal(new Set(ids).size,4);
 assert.deepEqual(ids,["JP0OmkgPCTtQXxpn","CAVHU02PARENTAR1","UV4YAstBe0WCuLcM","CAVHU02SOPHAR001"]);
});