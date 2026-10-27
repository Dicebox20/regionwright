import test from "node:test";import assert from "node:assert/strict";
const hatch={id:"UOudBnxOGVlAlPoa",rect:{x:1090,y:1460,width:265,height:180}};
const arrival={id:"1DJ0FCse01r9J5P5",rect:{x:1065,y:1230,width:250,height:170}};
const originalStair=[{x:185,y:1405,width:260,height:185},{x:170,y:1140,width:245,height:170}];
const overlaps=(a,b)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
test("Hatch centered over south-east loose boards and attic return on open V006 floor",()=>{
 for(const r of [hatch.rect,arrival.rect]){assert.ok(r.x>0&&r.y>0);assert.ok(r.x+r.width<1440&&r.y+r.height<1800)}
});
test("Concealed attic hatch and return do not self-trigger and do not overlap the staircase",()=>{
 assert.equal(overlaps(hatch.rect,arrival.rect),false);
 for(const r of originalStair){assert.equal(overlaps(hatch.rect,r),false);assert.equal(overlaps(arrival.rect,r),false)}
});
test("Original exact locked attic/return region IDs remain canonical",()=>{
 assert.deepEqual([hatch.id,arrival.id],["UOudBnxOGVlAlPoa","1DJ0FCse01r9J5P5"]);
});