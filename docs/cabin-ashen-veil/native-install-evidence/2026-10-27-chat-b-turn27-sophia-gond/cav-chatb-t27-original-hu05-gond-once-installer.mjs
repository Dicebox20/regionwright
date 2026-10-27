import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{readFileSync,writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
const cfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-sophia-gond-compartment-native.js').href);
const earlier=JSON.parse(readFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t27-bookcase-current-native.json','utf8'));
const code=cfg.disabledGondClaim(),tile=cfg.TILE;
const sha=s=>createHash('sha256').update(s).digest('hex');
const commit=process.argv.includes('--commit-once-disabled-gond-in-bookcase');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('GM /game absent');
 const data=await p.evaluate(async({code,tile,earlier,commit,originalBooks})=>{
 const ns='dicebox-campaign-helper';
 if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
 !game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw Error('Exact elected GM incorrect');
 const sc=game.scenes.get('CAVHU05Scene0001'),reg=sc?.regions.get('CAVB994894A7432F'),
 original=reg?.behaviors.get('LRYrBIQNN92SCJai'),sophiaReturn=sc?.regions.get('CAVHU05RETURN001');
 if(!sc||sc.name!=='H-U05 - Sophias Bedroom'||
 sc.background.src!=='Maps/cabin-in-the-ashen-veil/H-U05_Sophias_Bedroom_V004_OWNER_APPROVED_SOUTH_DOOR_REMOVED_2026-10-24.png'||
 sc.width!==1536||sc.height!==1024||sc.regions.size!==4||sc.tiles.size!==0||
 !reg||reg.behaviors.size!==1||!original||original.disabled!==false||
 original.type!=='executeScript'||original.system.source!==earlier.source||
 !sophiaReturn||sophiaReturn.behaviors.get('CAVHU05RETURNB01')?.disabled!==false)
 throw Error('Original Sophia bedroom changed: stop without write');
 const shape=reg.toObject().shapes[0];
 if(shape.type!=='rectangle'||shape.x!==930||shape.y!==135||
 shape.width!==220||shape.height!==170)
 throw Error('Approved original bookcase shape changed');
 const sources=originalBooks.map(uuid=>game.items.get(uuid.slice(5)));
 if(sources.some((i,index)=>!i||i.uuid!==originalBooks[index]||
 i.type!=='loot'||i.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY'))
 throw Error('Original six book Item source differs');
 const gond=game.items.get('o9G3UJjEe2QX1ZH0');
 if(!gond||gond.name!=='Gond Emblem Half'||gond.type!=='loot'||
 gond.img!==tile.texture.src||
 gond.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY')
 throw Error('Original Gond visual/source was modified');
 if(sc.tiles.get(tile._id)||reg.behaviors.get(code._id)||
 reg.getFlag(ns,'cavLateVaultRewardClaimV1')||
 reg.getFlag(ns,'cavSpineMosaicNativeV1')||
 reg.getFlag(ns,'cavSpineCompartmentNativeV1')||
 reg.getFlag(ns,'cavSophiaSixthBookCanonicalVeilV1')||
 game.actors.contents.some(a=>a.items.some(i=>i.name==='Gond Emblem Half')))
 throw Error('Existing reward/stage/duplicate state found: stop');
 if(code.disabled!==true||code.type!=='executeScript'||
 code.system.source.includes('CAVHU06Scene')||
 tile.hidden!==true||tile.locked!==true||tile.x<shape.x||tile.y<shape.y||
 tile.x+tile.width>shape.x+shape.width||
 tile.y+tile.height>shape.y+shape.height)
 throw Error('Source Tile and script invalid');
 const summary={world:game.world.id,scene:sc.uuid,gm:game.user.name,
  originalBookcase:reg.uuid,originalBehavior:original.uuid,
  oldSourceUnchanged:true,existingRegions:sc.regions.size,existingTiles:sc.tiles.size,
  originalSixBooks:sources.map(i=>i.uuid),originalGondSource:gond.uuid,
  addedBehaviorSourceChars:code.system.source.length,addedTile:tile._id,
  disabled:true,hidden:true,originalReturnActive:true,noIssuerLedger:true};
 if(!commit)return{status:'original-Sophia-bookcase-Gond-dormant-preflight-pass-no-writes',summary};
 const madeTile=await sc.createEmbeddedDocuments('Tile',[tile],{keepId:true});
 const addedTile=sc.tiles.get(tile._id);
 if(madeTile?.length!==1||!addedTile||addedTile.hidden!==true||
 addedTile.texture.src!==tile.texture.src||
 addedTile.getFlag(ns,'cavSophiaGondCompartmentVisual')?.status!=='hidden-original-bookcase')
 throw Error('Hidden source Tile partial, STOP and reconcile; no retry');
 const madeBehavior=await reg.createEmbeddedDocuments('RegionBehavior',[code],{keepId:true});
 const added=reg.behaviors.get(code._id);
 if(madeBehavior?.length!==1||!added||added.disabled!==true||
 added.type!=='executeScript'||
 added.system.source.trim()!==code.system.source.trim()||
 added.getFlag(ns,'cavSophiaOriginalGondSource')?.status!=='dormant-await-authentic-six-book-veil')
 throw Error('Gond behavior partial, STOP and reconcile; no retry');
 if(reg.behaviors.get('LRYrBIQNN92SCJai')?.disabled!==false||
 reg.behaviors.get('LRYrBIQNN92SCJai').system.source!==earlier.source||
 reg.behaviors.size!==2||sc.regions.size!==4||sc.tiles.size!==1||
 sc.regions.get('CAVHU05RETURN001')?.behaviors.get('CAVHU05RETURNB01')?.disabled!==false)
 throw Error('Final native audit uncertain, STOP no installer replay');
 return{status:'Sophia-original-bookcase-hidden-Gond-tile-and-disabled-native-issuer-installed',
 summary,addedTile:{uuid:addedTile.uuid,hidden:addedTile.hidden},
  addedBehavior:{uuid:added.uuid,disabled:added.disabled},
  originalCloseupStillEnabled:true,originalReturnStillEnabled:true,
  noPlayerGondReward:true,noSpineCompletionFlag:true};
 },{code,tile,earlier,commit,originalBooks:cfg.ORIGINAL_BOOKS});
 const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t27-sophia-gond-dormant-native-install.json';
 writeFileSync(out,JSON.stringify({...data,expectedScriptSHA256:sha(code.system.source)},null,2));
 console.log(JSON.stringify({...data,expectedScriptSHA256:sha(code.system.source)}).slice(0,7000));
}finally{await b.close()}