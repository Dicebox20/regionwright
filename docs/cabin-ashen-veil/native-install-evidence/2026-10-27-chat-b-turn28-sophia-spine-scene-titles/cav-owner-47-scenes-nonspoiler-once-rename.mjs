import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{writeFileSync}from'node:fs';
const names=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-owner-nonspoiler-scene-titles-20261027.js').href);
if(!names.validateNames())throw Error('Nonspoiler 47-Scene mapping invalid');
const commit=process.argv.includes('--owner-approved-commit-all-47-title-only');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('GM /game tab absent');
const data=await p.evaluate(async({mapping,commit})=>{
 if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||
 game.version!=='14.367'||!game.user?.isGM||
 game.users?.activeGM?.id!==game.user.id)
 throw Error('Wrong active elected GM world');
 const all=game.scenes.contents;
 if(all.length!==47||mapping.length!==47||new Set(mapping.map(x=>x.id)).size!==47||
 new Set(mapping.map(x=>x.newName)).size!==47)
 throw Error('Scene count/unique mapping changed');
 const originals=mapping.map(m=>{
  const s=game.scenes.get(m.id);
  if(!s||s.name!==m.prior||s.documentName!=='Scene')
   throw Error('Scene baseline changed '+m.id+' expected '+m.prior+' got '+s?.name);
  return{id:s.id,uuid:s.uuid,oldName:s.name,newName:m.newName,
   art:s.background.src,walls:s.walls.size,tiles:s.tiles.size,
   regions:s.regions.size,behaviors:s.regions.contents.reduce((n,r)=>n+r.behaviors.size,0),
   active:s.active,navigation:s.navigation,sort:s.sort};
 });
 if(originals.some(x=>x.id.length!==16)||originals.some(x=>x.oldName===x.newName))
 throw Error('Invalid original scene IDs/names');
 const exactOriginalIds=new Set(originals.map(x=>x.id));
 if(all.some(s=>!exactOriginalIds.has(s.id)))throw Error('Unexpected world scene not in mapping');
 const src=game.scenes.get('CAVHU05Scene0001')?.regions.get('CAVB994894A7432F');
 const rw=src?.getFlag('regionwright','spineMosaic');
 const guarded=src?.getFlag('dicebox-campaign-helper','cavSophiaSpineRegionwrightStage');
 const spine=Array.from(src?.behaviors??[]).filter(x=>x.flags?.regionwright?.spineMosaic?.region===true);
 if(src.name!=="Sophia's Bookcase — Six Storybooks"||!rw||
  rw.persistent?.status!=='locked'||rw.config?.books.length!==6||
  spine.length!==1||spine[0].disabled!==true||
  src.behaviors.get('LRYrBIQNN92SCJai')?.disabled!==false||
  src.behaviors.get('CAVGONDREWARD001')?.disabled!==true||
  guarded?.status!=='configured-disabled-await-authentic-sixth-veil')
 throw Error('Sophia is not accurately configured or reward disabled, stop Scene rename');
 const pre={world:game.world.id,gm:game.user.name,
  originals,sceneCount:47,newNamesDistinct:true,
  sophiaExactSpineConfiguredDisabled:true,
  sceneDocumentsWillNotBeReplaced:true,
  oldTwoLegacyInstallerMacrosReferenceSceneTitles:true,
  noRegionsOrBehaviorsOrSceneIdsModified:true,
  nonGmUsersActive:game.users.contents.filter(u=>u.active&&!u.isGM).length};
 if(!commit)return{status:'owner-nonspoiler-47-scene-title-only-preflight-no-writes',pre};
 const klass=getDocumentClass('Scene');
 if(typeof klass?.updateDocuments!=='function')throw Error('Native Scene update API absent');
 const updates=mapping.map(m=>({_id:m.id,name:m.newName}));
 const made=await klass.updateDocuments(updates);
 const post=mapping.map(m=>{
  const s=game.scenes.get(m.id),old=originals.find(x=>x.id===m.id);
  if(!s||s.name!==m.newName||s.uuid!==old.uuid||
    s.background.src!==old.art||s.regions.size!==old.regions||
    s.tiles.size!==old.tiles||s.walls.size!==old.walls||
    s.regions.contents.reduce((n,r)=>n+r.behaviors.size,0)!==old.behaviors||
    s.active!==old.active||s.navigation!==old.navigation||s.sort!==old.sort)
   throw Error('Partial name batch, stop and independently reread, NEVER replay as original');
  return{id:s.id,oldName:old.oldName,newName:s.name};
 });
 if(made.length!==47)throw Error('Native 47 scene update count uncertain, independently reread');
 if(src.name!=="Sophia's Bookcase — Six Storybooks"||
 spine[0].disabled!==true||src.behaviors.get('CAVGONDREWARD001').disabled!==true||
 game.scenes.get('CAVHU05Scene0001').name!=='F2 — Small Bedroom')
 throw Error('Puzzle or Sophia new name changed, independently verify');
 return{status:'owner-approved-47-spoilerfree-scene-titles-installed-no-ids-changed',
 pre,post,changes:made.length,noPuzzleProgressChanged:true};
},{mapping:names.SCENE_NAMES,commit});
const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-owner-47-spoilerfree-scene-renames-native.json';
writeFileSync(path,JSON.stringify(data,null,2));
console.log(JSON.stringify({status:data.status,sceneCount:data.pre.sceneCount,
 updated:data.changes??0,preview:data.post?.slice(0,12),sophia:data.pre.sophiaExactSpineConfiguredDisabled}).slice(0,3500));
}finally{await b.close()}