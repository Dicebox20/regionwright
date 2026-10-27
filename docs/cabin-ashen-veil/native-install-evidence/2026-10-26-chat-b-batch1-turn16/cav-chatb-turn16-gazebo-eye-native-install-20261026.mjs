import {chromium} from 'playwright-core';
import {writeFileSync} from 'node:fs';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
const commit=process.argv.includes('--commit-owner-gazebo-eye');
const src=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-gazebo-native-ignition-eye.js').href);
const ignition=src.gazeboNativeBehaviorSource('ignite');
const claim=src.gazeboNativeBehaviorSource('claim');
const hash=s=>createHash('sha256').update(s).digest('hex');
const data={scene:src.GAZEBO_SCENE,art:src.GAZEBO_APPROVED_MAP,lantern:src.GAZEBO_LANTERN_REGION,
 marker:src.GAZEBO_EYE_REGION,tile:src.GAZEBO_EYE_TILE,
 ignition:src.GAZEBO_IGNITION_BEHAVIOR,eyeBehavior:src.GAZEBO_EYE_BEHAVIOR,
 source:src.GAZEBO_EYE_SOURCE,rect:src.GAZEBO_MARKER_RECT,visual:src.GAZEBO_EYE_VISUAL,
 ignitionSource:ignition,claimSource:claim};
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('Exact GM game tab absent');
 const receipt=await p.evaluate(async({data,commit})=>{
  const ns='dicebox-campaign-helper',scene=game.scenes.get(data.scene);
  if(!game?.ready||game.world?.id!=='cabin-in-the-ashen-veil'||
     game.version!=='14.367'||!game.user?.isGM||game.users.activeGM?.id!==game.user.id)
   throw Error('Elected GM/world mismatch');
  if(!scene||scene.background.src!==data.art||scene.width!==1920||scene.height!==1440)
   throw Error('Owner-approved original gazebo art/size changed');
  const lantern=scene.regions.get(data.lantern);
  const originalLantern=lantern?.behaviors.get('CAVLANTERNBEH001');
  if(!lantern||!originalLantern||originalLantern.disabled||
   originalLantern.type!=='executeScript'||
   lantern.behaviors.size!==1||
   lantern.getFlag(ns,'cavLateBatch1')?.status!=='physical-fixture-staged')
   throw Error('Original installed lantern was modified');
  if(scene.regions.has(data.marker)||scene.tiles.has(data.tile)||
   lantern.behaviors.has(data.ignition)||
   Array.from(scene.regions).some(r=>r.getFlag(ns,'cavLateEyeMarker')?.status))
   throw Error('Gazebo eye marker already present; reconcile without replay');
  const eye=game.items.get(data.source.split('.')[1]);
  if(!eye||eye.uuid!==data.source||eye.type!=='loot'||
   !eye.name.includes('Second Glass Eye')||
   eye.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY'||
   !eye.img?.endsWith('Rufus_Second_Button_Eye.png'))
   throw Error('Original approved eye Item/source art mismatch');
  if(Array.from(game.actors).some(a=>a.items.some(i=>i.name===eye.name||
   i.getFlag(ns,'cavLateGazeboEye2SourceUuid')===eye.uuid)))
   throw Error('Second eye already issued in world actors');
  const oil=game.items.get('CAVLAMPOIL000001'),wick=game.items.get('o0g8PyGRIbdwVM3m');
  if(!oil||oil.uuid!=='Item.CAVLAMPOIL000001'||oil.name!=='Lamp Oil'||
     !wick||wick.uuid!=='Item.o0g8PyGRIbdwVM3m'||wick.name!=='Wick')
   throw Error('Original oil/wick templates missing');
  const lflags=['cavLateGazeboOil','cavLateGazeboWick','cavLateGazeboIgnition'];
  if(lflags.some(k=>lantern.getFlag(ns,k)))
   throw Error('Current lantern progression has changed, preflight fresh');
  const c=data.rect;
  if(c.x<0||c.y<0||c.width<80||c.height<80||c.x+c.width>scene.width||
     c.y+c.height>scene.height)throw Error('Marker rectangle unsafe');
  if(data.visual.x<c.x||data.visual.y<c.y||
    data.visual.x+data.visual.width>c.x+c.width||
    data.visual.y+data.visual.height>c.y+c.height)
    throw Error('Visual image is outside intended Region');
  const collisions=[];
  for(const r of scene.regions)for(const sh of r.toObject().shapes){
    if(sh.type==='rectangle'&&c.x<sh.x+sh.width&&c.x+c.width>sh.x&&
       c.y<sh.y+sh.height&&c.y+c.height>sh.y)collisions.push({id:r.id,name:r.name});
  }
  if(collisions.length)throw Error('Owner Region overlap '+JSON.stringify(collisions));
  if(Array.from(scene.tokens).some(t=>t.x<c.x+c.width&&t.x+t.width*scene.grid.size>c.x&&
    t.y<c.y+c.height&&t.y+t.height*scene.grid.size>c.y))
   throw Error('Active token at marker; no world write');
  const checks={world:game.world.id,sceneId:scene.id,originalLanternId:originalLantern.id,
     originalItem:eye.uuid,originalEyeImage:eye.img,rect:c,visual:data.visual,
     nativeItemsUnique:true,markerCollisionCount:0,sourceLengths:[data.ignitionSource.length,data.claimSource.length]};
  if(!commit)return{status:'preflight-pass-no-writes',checks};
  const created=[];
  const madeRegion=await scene.createEmbeddedDocuments('Region',[{
   _id:data.marker,name:'EXT-05 - Revealed Rufus Second Glass Eye',color:'#b3a4c1',
   visibility:0,
   shapes:[{type:'rectangle',x:c.x,y:c.y,width:c.width,height:c.height,rotation:0,hole:false}],
   behaviors:[{_id:data.eyeBehavior,name:'Original second eye — elected GM authenticated claim',
     type:'executeScript',disabled:false,system:{events:['tokenMoveIn','tokenMoveWithin'],
       source:data.claimSource}}],
   flags:{[ns]:{cavLateEyeMarker:{status:'original-hidden-fixture',originalEyeUuid:eye.uuid,approvedArt:scene.background.src}}}
  }],{keepId:true});
  const mr=scene.regions.get(data.marker),mb=mr?.behaviors.get(data.eyeBehavior);
  if(madeRegion.length!==1||!mr||!mb||mb.disabled||
      mb.system.source.trim()!==data.claimSource.trim())
    throw Error('Partial eye marker Region; STOP and independently reread');
  created.push({type:'Region',uuid:mr.uuid,behaviorUuid:mb.uuid});
  const madeTile=await scene.createEmbeddedDocuments('Tile',[{
    _id:data.tile,x:data.visual.x,y:data.visual.y,width:data.visual.width,height:data.visual.height,
    alpha:1,hidden:true,elevation:0,sort:0,
    texture:{src:eye.img,scaleX:1,scaleY:1},
    flags:{[ns]:{cavLateEyeVisual:{status:'hidden-original-eye',regionUuid:mr.uuid,sourceUuid:eye.uuid}}}
  }],{keepId:true});
  const tile=scene.tiles.get(data.tile);
  if(madeTile.length!==1||!tile||tile.hidden!==true||tile.texture.src!==eye.img)
   throw Error('Partial hidden eye Tile; STOP and independently reread');
  created.push({type:'Tile',uuid:tile.uuid,hidden:tile.hidden});
  await mr.setFlag(ns,'cavLateEyeTwoMarker',{status:'hidden',sourceUuid:eye.uuid});
  if(mr.getFlag(ns,'cavLateEyeTwoMarker')?.status!=='hidden')
   throw Error('Marker hidden stage unreadable, reconcile');
  const madeBehavior=await lantern.createEmbeddedDocuments('RegionBehavior',[{
    _id:data.ignition,name:'Original lantern ignition — requires oil + wick',
    type:'executeScript',disabled:false,
    system:{events:['tokenMoveIn','tokenMoveWithin'],source:data.ignitionSource}
  }],{keepId:true});
  const ib=lantern.behaviors.get(data.ignition);
  if(madeBehavior.length!==1||!ib||ib.disabled||ib.system.source.trim()!==data.ignitionSource.trim()||
    lantern.behaviors.size!==2||lantern.behaviors.get('CAVLANTERNBEH001')!==originalLantern)
   throw Error('Partial ignition behavior install; stop and inspect');
  created.push({type:'RegionBehavior',uuid:ib.uuid,enabled:true});
  return{status:'installed-owner-gazebo-ignition-and-eye-marker',checks,created};
 },{data,commit});
 const output='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn16-gazebo-native-install-20261026.json';
 writeFileSync(output,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
}finally{await b.close()}