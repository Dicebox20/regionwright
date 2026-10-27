import{chromium}from'playwright-core';import{pathToFileURL}from'node:url';
import{readFileSync,writeFileSync}from'node:fs';import{createHash}from'node:crypto';
const cfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-sophia-gond-compartment-native.js').href);
const baseline=JSON.parse(readFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t27-bookcase-current-native.json','utf8'));
const sha=s=>createHash('sha256').update(s).digest('hex');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('No elected GM tab');
const j=await p.evaluate(()=>{
const ns='dicebox-campaign-helper';
if(!game.ready||game.version!=='14.367'||game.world?.id!=='cabin-in-the-ashen-veil'||
!game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('Wrong GM');
const sc=game.scenes.get('CAVHU05Scene0001'),r=sc.regions.get('CAVB994894A7432F'),
old=r.behaviors.get('LRYrBIQNN92SCJai'),cur=r.behaviors.get('CAVGONDREWARD001'),
tile=sc.tiles.get('CAVHU05GONDTILE1');
return{world:game.world.id,gm:game.user.name,
 sceneRegions:sc.regions.size,sceneTiles:sc.tiles.size,
 originalBookcase:{uuid:r.uuid,shape:r.toObject().shapes[0],behaviorCount:r.behaviors.size,
  originalDisabled:old.disabled,originalSource:old.system.source},
 gondBehavior:{uuid:cur?.uuid,disabled:cur?.disabled,type:cur?.type,
  events:Array.from(cur?.system?.events||[]),source:cur?.system?.source,
  flag:cur?.getFlag(ns,'cavSophiaOriginalGondSource')},
 tile:{uuid:tile?.uuid,hidden:tile?.hidden,locked:tile?.locked,
  x:tile?.x,y:tile?.y,width:tile?.width,height:tile?.height,
  img:tile?.texture.src,flag:tile?.getFlag(ns,'cavSophiaGondCompartmentVisual')},
 originalReturnActive:sc.regions.get('CAVHU05RETURN001')?.behaviors.get('CAVHU05RETURNB01')?.disabled===false,
 rewardLedger:r.getFlag(ns,'cavLateVaultRewardClaimV1')??null,
 spineLedger:r.getFlag(ns,'cavSpineMosaicNativeV1')??null,
 compartmentLedger:r.getFlag(ns,'cavSpineCompartmentNativeV1')??null,
 originalBooks:['Qplmy8JR7plDYLiY','DLGIhHc0RDqh0YVt','TO69wBYN8sRJuxtH','c3oKW8YkklE8slnX','HV7XjKmgqVITSEvW','gmTsIOqc3qFBc3zA'].map(id=>({uuid:game.items.get(id)?.uuid,status:game.items.get(id)?.getFlag(ns,'cabinPuzzleItem')?.status})),
 originalGond:{uuid:game.items.get('o9G3UJjEe2QX1ZH0')?.uuid,status:game.items.get('o9G3UJjEe2QX1ZH0')?.getFlag(ns,'cabinPuzzleItem')?.status},
 actorGondCopies:game.actors.contents.flatMap(a=>a.items.filter(i=>i.name==='Gond Emblem Half')).length,
 vaultGondSocketDisabled:game.scenes.get('G6NMonfCwMvNzipL')?.regions.get('CAVVAULTGOND0001')?.behaviors.get('CAVVGONDBEH00001')?.disabled===true
};});
const expected=cfg.disabledGondClaim(),tile=cfg.TILE;
const pass=j.sceneRegions===4&&j.sceneTiles===1&&
 j.originalBookcase.uuid==='Scene.CAVHU05Scene0001.Region.CAVB994894A7432F'&&
 j.originalBookcase.shape.x===930&&j.originalBookcase.shape.y===135&&
 j.originalBookcase.behaviorCount===2&&j.originalBookcase.originalDisabled===false&&
 j.originalBookcase.originalSource===baseline.source&&
 j.gondBehavior.uuid==='Scene.CAVHU05Scene0001.Region.CAVB994894A7432F.RegionBehavior.CAVGONDREWARD001'&&
 j.gondBehavior.disabled===true&&j.gondBehavior.type==='executeScript'&&
 j.gondBehavior.source.trim()===expected.system.source.trim()&&
 j.gondBehavior.events.join('|')==='tokenMoveIn|tokenMoveWithin'&&
 j.gondBehavior.flag?.status==='dormant-await-authentic-six-book-veil'&&
 j.tile.uuid==='Scene.CAVHU05Scene0001.Tile.CAVHU05GONDTILE1'&&
 j.tile.hidden===true&&j.tile.locked===true&&j.tile.img===tile.texture.src&&
 j.tile.x===tile.x&&j.tile.y===tile.y&&j.tile.width===tile.width&&j.tile.height===tile.height&&
 j.tile.flag?.status==='hidden-original-bookcase'&&
 j.originalReturnActive&&j.rewardLedger===null&&j.spineLedger===null&&
 j.compartmentLedger===null&&
 j.originalBooks.every((i,index)=>i.uuid===cfg.ORIGINAL_BOOKS[index]&&i.status==='GM_LIBRARY_ONLY')&&
 j.originalGond.uuid===cfg.GOND_SOURCE&&j.originalGond.status==='GM_LIBRARY_ONLY'&&
 j.actorGondCopies===0&&j.vaultGondSocketDisabled;
const out={pass,world:j.world,gm:j.gm,originalBookcaseSourceSHA256:sha(j.originalBookcase.originalSource),
 newBehaviorSourceSHA256:sha(j.gondBehavior.source||''),expectedBehaviorSourceSHA256:sha(expected.system.source),
 behaviorUuid:j.gondBehavior.uuid,disabled:j.gondBehavior.disabled,tile:j.tile,
 originalCloseupUnchanged:j.originalBookcase.originalSource===baseline.source&&j.originalBookcase.originalDisabled===false,
 originalReturnActive:j.originalReturnActive,originalSourceItems:j.originalBooks,
 originalGond:j.originalGond,rewardLedger:j.rewardLedger,
 spineLedger:j.spineLedger,compartmentLedger:j.compartmentLedger,
 actorGondCopies:j.actorGondCopies,vaultSocketDisabled:j.vaultGondSocketDisabled};
writeFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-t27-sophia-gond-independent-postread.json',JSON.stringify(out,null,2));
console.log(JSON.stringify(out).slice(0,6000));if(!pass)throw Error('Independent native source staging proof failed');
}finally{await b.close()}