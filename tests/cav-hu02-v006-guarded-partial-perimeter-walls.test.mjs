import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
const manifest=JSON.parse(readFileSync(new URL("../docs/cabin-ashen-veil/h-u02-v006-conservative-side-shell-structural-wall-manifest-2026-10-27.json",import.meta.url),"utf8"));
const walls=manifest.segments.map(s=>s.c);
const regions=[
["studio",[155,135,250,185]],["studio-return",[165,360,250,165]],
["parents",[620,80,220,150]],["parents-return",[620,265,220,150]],
["sophia",[1120,115,235,170]],["sophia-return",[1100,345,230,160]],
["nursery",[80,530,230,210]],["nursery-return",[360,560,220,200]],
["guest",[1110,535,235,205]],["guest-return",[850,550,220,200]],
["stair",[185,1405,260,185]],["stair-return",[170,1140,245,170]],
["attic",[1090,1460,265,180]],["attic-return",[1065,1230,250,170]]
];
const cross=(wall,reg)=>{const[x1,y1,x2,y2]=wall,[rx,ry,w,h]=reg;return x1===x2?
  x1>rx&&x1<rx+w&&Math.max(Math.min(y1,y2),ry)<Math.min(Math.max(y1,y2),ry+h):
  y1>ry&&y1<ry+h&&Math.max(Math.min(x1,x2),rx)<Math.min(Math.max(x1,x2),rx+w)};
test("Exact owner-approved V006 six stable wall IDs and original source document",()=>{
 assert.equal(manifest.scene,"gGgUHlHdI7RFrbUh");
 assert.equal(manifest.segments.length,6);
 assert.ok(manifest.segments.every((s,i)=>s.id==="CAVHU02WALL"+String(i+1).padStart(5,"0")));
 assert.ok(manifest.segments.every(s=>s.id.length===16));
 assert.ok(manifest.pending.includes("SOUTH"));
});
test("All partial perimeter segments lie on straight physical wall runs inside 1440x1800 scene",()=>{
 for(const [x1,y1,x2,y2] of walls){
  assert.ok([x1,y1,x2,y2].every(Number.isInteger));
  assert.ok(x1>=0&&x2<=1440&&y1>=0&&y2<=1800);
  assert.ok((x1===x2)!==(y1===y2));
  assert.ok(Math.hypot(x2-x1,y2-y1)>=120);
 }
});
test("None of the 14 original Region interaction or return rectangles is crossed by installed walls",()=>{
 for(const w of walls)for(const [name,r] of regions)assert.equal(cross(w,r),false,"wall "+w+" clips "+name);
});
test("West Nursery and east Guest side door openings remain free between upper/lower wall sections",()=>{
 const west=walls.filter(w=>w[0]===100&&w[2]===100).sort((a,b)=>a[1]-b[1]);
 const east=walls.filter(w=>w[0]===1365&&w[2]===1365).sort((a,b)=>a[1]-b[1]);
 assert.equal(west.length,2);assert.equal(east.length,2);
 assert.ok(west[0][3]<=530&&west[1][1]>=740);
 assert.ok(east[0][3]<=535&&east[1][1]>=740);
});
test("Open south shell intentionally avoids trapping two original PC token centers",()=>{
 const centers=[[604+110,1495+110],[648+110,1654+110]];
 for(const w of walls)for(const [x,y] of centers){
  assert.ok(!(w[0]===w[2]&&x===w[0]&&y>=Math.min(w[1],w[3])&&y<=Math.max(w[1],w[3])));
  assert.ok(!(w[1]===w[3]&&y===w[1]&&x>=Math.min(w[0],w[2])&&x<=Math.max(w[0],w[2])));
 }
 assert.ok(walls.every(w=>!(w[1]===w[3]&&w[1]>1200)));
});