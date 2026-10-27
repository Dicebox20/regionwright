import test from "node:test";
import assert from "node:assert/strict";
const scene={id:"gGgUHlHdI7RFrbUh",width:1440,height:1800,grid:220};
const source={id:"QunJFtigwByZndFV",rect:{x:185,y:1405,width:260,height:185}};
const arrival={id:"xPTEg7ce2Bliz9M0",rect:{x:170,y:1140,width:245,height:170}};
const oldSource={x:630,y:2092,width:200,height:125},oldArrival={x:632,y:1968,width:200,height:120};
const inside=(a,p)=>p.x>a.x&&p.x<a.x+a.width&&p.y>a.y&&p.y<a.y+a.height;
const overlap=(a,b)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
test("Original 1440x1800 gallery had inaccessible stair Regions",()=>{
 assert.ok(oldSource.y>=scene.height&&oldArrival.y>=scene.height);
});
test("Replacement visible staircase and upper-landing targets fit approved V006 scene bounds",()=>{
 for(const r of [source.rect,arrival.rect]){
  assert.ok(r.x>0&&r.y>0&&r.x+r.width<scene.width&&r.y+r.height<scene.height);
  assert.ok(r.width>=scene.grid&&r.height>0);
 }
 assert.equal(overlap(source.rect,arrival.rect),false);
});
test("Stair descent and upward landing have disjoint safe centers",()=>{
 const center=r=>({x:r.x+r.width/2,y:r.y+r.height/2});
 assert.equal(inside(source.rect,center(source.rect)),true);
 assert.equal(inside(arrival.rect,center(arrival.rect)),true);
 assert.equal(inside(source.rect,center(arrival.rect)),false);
 assert.equal(inside(arrival.rect,center(source.rect)),false);
});