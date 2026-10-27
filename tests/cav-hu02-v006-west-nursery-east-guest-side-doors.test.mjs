import test from "node:test";
import assert from "node:assert/strict";
const sideDoors=[
 {id:"aZ8eagmbvZUcPJ0g",name:"west nursery",rect:{x:80,y:530,width:230,height:210}},
 {id:"GOxaHb5OuQwPj6IC",name:"nursery return",rect:{x:360,y:560,width:220,height:200}},
 {id:"M2fZhuvFmw1yZQS9",name:"east guest",rect:{x:1110,y:535,width:235,height:205}},
 {id:"dMdq36QOZUhvttza",name:"guest return",rect:{x:850,y:550,width:220,height:200}}
];
const overlap=(a,b)=>a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
test("Original west Nursery / east Guest doors match distinct V006 wooden side-wall panels",()=>{
 assert.ok(sideDoors[0].rect.x+sideDoors[0].rect.width<1440/2);
 assert.ok(sideDoors[2].rect.x>1440/2);
 assert.equal(sideDoors[0].rect.y,530);
 assert.equal(sideDoors[2].rect.y,535);
});
test("Original four in-place native Region targets stay inside V006 and avoid self-triggering",()=>{
 for(const {rect:r}of sideDoors){
  assert.ok(r.x>0&&r.y>0&&r.x+r.width<1440&&r.y+r.height<1800);
  assert.ok(r.width>=220&&r.height>=200);
 }
 for(let i=0;i<sideDoors.length;i++)for(let j=i+1;j<sideDoors.length;j++)
  assert.equal(overlap(sideDoors[i].rect,sideDoors[j].rect),false);
});
test("Do not replace original Nursery or Guest teleport/reciprocal landing identities",()=>{
 assert.deepEqual(sideDoors.map(r=>r.id),["aZ8eagmbvZUcPJ0g","GOxaHb5OuQwPj6IC","M2fZhuvFmw1yZQS9","dMdq36QOZUhvttza"]);
});