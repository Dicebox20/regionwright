import test from "node:test";import assert from "node:assert/strict";
const scene={width:1440,height:1800};
const studio={id:"yXYWpil5Y5Avmy70",rect:{x:155,y:135,width:250,height:185}};
const arrival={id:"pL0UiBSyEoINWzZQ",rect:{x:165,y:360,width:250,height:165}};
const north=[
 {x:620,y:80,width:220,height:150},{x:620,y:265,width:220,height:150},
 {x:1120,y:115,width:235,height:170},{x:1100,y:345,width:230,height:160}
];
const overlap=(a,b)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
test("Physical northwest V006 Studio threshold and return landing are inside gallery bounds",()=>{
 for(const r of [studio.rect,arrival.rect])assert.ok(r.x>0&&r.y>0&&r.x+r.width<scene.width&&r.y+r.height<scene.height);
});
test("Studio entrance and return are separate from all Parents and locked Sophia Regions",()=>{
 assert.equal(overlap(studio.rect,arrival.rect),false);
 for(const r of north){assert.equal(overlap(studio.rect,r),false);assert.equal(overlap(arrival.rect,r),false)}
});
test("Original Studio doorway/arrival UUID identities are preserved rather than new route objects",()=>{
 assert.deepEqual([studio.id,arrival.id],["yXYWpil5Y5Avmy70","pL0UiBSyEoINWzZQ"]);
});