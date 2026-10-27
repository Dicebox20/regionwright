import{readFileSync,writeFileSync}from'node:fs';
import{pathToFileURL}from'node:url';
const root=String.raw`C:/Users/rujie/Documents/CAV-Chat-B-Late-Game`;
const source=await import(pathToFileURL(root+'/modules/regionwright/scripts/studio-cav-ambience-four-phase.js').href);
const names=source.makeCatalog();
const original=JSON.parse(readFileSync(new URL('./cav-ambience-four-phase-originals-and-preflight.json',import.meta.url)));
const j=JSON.parse(readFileSync(new URL('./cav-ambience-area-readaloud-all-59-pages.json',import.meta.url)));
const proof=JSON.parse(readFileSync(new URL('./cav-ambience-four-phase-early-independent-postread.json',import.meta.url)));
if(!proof.pass||names.length!==47||j.pages.length!==59)throw Error('Source native evidence missing');
const pages=j.pages;
function sourcePages(n){
 let code=n.formerName.match(/^(H-[A-Z]\d+|SG-\d+|EXT-\d+|UND-\d+|AQ-\d+|BATH-\d+|FM-\d+)/)?.[1];
 if(!code&&n.id==='CAVFM01Scene0001')code='FM-01';
 if(!code&&n.id==='CAVAQ01Scene0001')code='AQ-01';
 if(!code&&n.id==='CAVBATHScene0001')code='BATH-01';
 if(!code&&n.id==='8yLMRDvxyw58dydh')code='BATH-01';
 if(!code&&n.id==='CAVTRAILScene001')code='EXT-TRAIL';
 if(!code)throw Error('No journal source mapping for '+n.id);
 const found=pages.filter(x=>x.name.startsWith(code+' ')||x.name.startsWith(code+' —'));
 if(!found.length)throw Error('No original page for '+n.id+' '+code);
 return found.map(x=>x.name).join('; ');
}
const rows=names.map((n,i)=>{
 const data=original.plan[n.id],prior=original.originals[n.id],matched=sourcePages(n);
 return{...n,originalDarkness:prior.darknessLevel,linkedReadaloud:matched,
  early:data.early.darknessLevel,mid:data.mid.darknessLevel,late:data.late.darknessLevel,
  crimson:data.crimson.darknessLevel,earlyFX:data.early.particle?.type||'—',
  originalWeather:prior.weather,earlyWeather:data.early.weather,
  currentVerified:proof.allScenes.find(s=>s.id===n.id)?.pass===true
 };
});
if(rows.some(x=>!x.currentVerified))throw Error('Native postread not same as narrative matrix');
const lines=[
 '# Cabin in the Ashen Veil — Four-phase ambience matrix (GM)',
 '',
 'Created 2026-10-27 Pacific. Original 59-page Foundry Journal `JournalEntry.9dngVaa6ctgFAqd2` read in full. 47 current Scenes are mapped to descriptions. Only **Early Game** is applied and verified; Midgame, Late Game and Crimson Veil are prepared, intentionally inactive and not playtested.',
 '',
 '**How to switch:** Macro Directory → `CAV — Ambience Phases (GM)` → choose phase. Restore Original Scene Ambience returns every original darkness/weather/dark-hue setting and removes only the two FXMaster IDs owned by this macro. All changes use native Scene configuration plus documented FXMaster direct effects API. Only elected GM can run. No automatic storyline phase listener.',
 '',
 '**Safeguards:** All 47 Scene IDs, Region Behaviors, teleports, walls, tokens, ambient sound objects and ambient light objects preserved. Global light and token vision untouched. Original Carriage Yard FXMaster rain preserved. Existing generic fog removed indoors; low-density API-managed fog added only to 15 eligible exterior Scenes with stable IDs. Future phases deepen darkness; Crimson also uses a red color grade. Visual intensity should be checked with non-GM player before live phase switch.',
 '',
 '| Scene title | Original read-aloud reference | Early | Mid | Late | Crimson | Early FX | Tone |',
 '| --- | --- | ---: | ---: | ---: | ---: | --- | --- |',
 ...rows.map(r=>`| ${r.name} | ${r.linkedReadaloud.replaceAll('|','/')} | ${r.early.toFixed(2)} | ${r.mid.toFixed(2)} | ${r.late.toFixed(2)} | ${r.crimson.toFixed(2)} | ${r.earlyFX} | ${r.tone} |`),
 '',
 'Original narrative text and original Scene native snapshot saved in the adjacent machine-readable read-only proof JSON. No player spoiler dialogue has been added to Scene descriptions.',
 '',
 '**FXMaster version verified:** 8.3.6. API probe created and removed a stable low fog row in an unoccupied Grove Scene, preserving earlier FX. Full Early phase readback `pass:true`: 47/47 Scene settings, 15/15 FX rows, existing 11 sound objects, five ambient lights and all original Regions verified unchanged.',
 ''
];
writeFileSync(new URL('./SCENE-PHASE-MATRIX.md',import.meta.url),lines.join('\n'));
writeFileSync(new URL('./SCENE-PHASE-MATRIX.json',import.meta.url),JSON.stringify({date:'2026-10-27',journal:j.journal,originalReadaloudPageCount:pages.length,phaseActive:'early',scenes:rows},null,2));
console.log(JSON.stringify({scenes:rows.length,descriptions:pages.length,fx:rows.filter(r=>r.earlyFX!=='—').length,pagesMapped:rows.every(x=>!!x.linkedReadaloud)}));