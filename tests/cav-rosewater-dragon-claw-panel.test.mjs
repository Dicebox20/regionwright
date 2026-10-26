import test from"node:test";import{readFileSync}from"node:fs";import assert from"node:assert/strict";
import{renderCavRosewaterClawPanel}from"../modules/regionwright-puzzles-locks/scripts/rosewater-dragon-claw-panel.js";
test("Three clickable independent Skyrim-style ring surfaces include 4 medallions each",()=>{
 const html=renderCavRosewaterClawPanel(["symbol-one","symbol-two","symbol-three","symbol-four"],[1,3,2]);
 assert.equal((html.match(/class="rw-claw-ring /g)||[]).length,3);
 assert.equal((html.match(/class="rw-claw-glyph"/g)||[]).length,12);
 assert.ok(html.includes('data-claw-ring="outer"'));assert.ok(html.includes('data-claw-ring="middle"'));assert.ok(html.includes('data-claw-ring="inner"'));
 assert.ok(html.includes('--angle:90deg'));assert.ok(html.includes('--angle:270deg'));assert.ok(html.includes('--angle:180deg'));
 assert.ok(html.includes('data-claw-submit'));assert.ok(html.includes('rw-claw-marker'));
});
test("Symbol sets are intentionally NOT chosen by code; 4 unique identifiers mandatory",()=>{
 assert.throws(()=>renderCavRosewaterClawPanel(["a","b","c"],[0,0,0]),/four approved unique/);
 assert.throws(()=>renderCavRosewaterClawPanel(["a","b","c","c"],[0,0,0]),/Invalid unique/);
 assert.throws(()=>renderCavRosewaterClawPanel(["a","b","c","d"],[0,0,7]),/Invalid GM/);
});

test("Counter-rotation keeps all four medallion labels upright as their stone rings rotate",()=>{
 const code=readFileSync(new URL("../modules/regionwright-puzzles-locks/scripts/rosewater-dragon-claw-panel.js",import.meta.url),"utf8");
 assert.match(code,/\.rw-claw-glyph\{[^"]*rotate\(calc\(-1 \* var\(--angle\)\)\)/);
});
