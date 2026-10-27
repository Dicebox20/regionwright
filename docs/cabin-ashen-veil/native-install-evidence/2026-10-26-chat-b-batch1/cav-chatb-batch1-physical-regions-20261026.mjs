import {chromium} from 'playwright-core';
import {writeFileSync} from 'node:fs';
const commit=process.argv.includes('--commit-original-fixtures');
const NS='dicebox-campaign-helper';
const plan=[
 {scene:'CAVHU04Scene0001',sceneTitle:'H-U04 - Parents Bedroom',
  art:'Maps/cabin-in-the-ashen-veil/H-U04_Parents_Bedroom_V003_OWNER_APPROVED_CLOSED_WINDOW_2026-10-24.png',
  id:'CAVHU04HOPECHST1',name:'H-U04 - Hope Chest (late Silver Key)',box:{x:1100,y:688,width:185,height:132},
  purpose:'chest-and-music-box',basis:'approved v003 map, visibly banded trunk in southeast room; no puzzle behaviors'},
 {scene:'CAVEXT05Scene001',sceneTitle:'EXT-05 - Forgotten Gazebo',
  art:'Maps/cabin-in-the-ashen-veil/ext-05_forgotten-gazebo_owner-approved.png',
  id:'CAVEXT05LANTERN1',name:'EXT-05 - Gazebo Hanging Lantern (Wick and Lamp Oil)',box:{x:920,y:375,width:105,height:135},
  purpose:'gazebo-lantern',basis:'owner-approved map, suspended lantern in gazebo at approximate x970,y425; no puzzle behaviors'}
];
const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-batch1-physical-regions-20261026.json';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('Exact Foundry game page missing');
 const result=await p.evaluate(async ({plan,commit,NS})=>{
  if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||!game.user?.isGM||game.users.activeGM?.id!==game.user.id)throw Error('World/elected GM mismatch');
  const docs=[];
  for(const cfg of plan){
   const scene=game.scenes.get(cfg.scene);
   if(!scene||scene.name!==cfg.sceneTitle||scene.background.src!==cfg.art)throw Error('Scene or approved map mismatch '+cfg.scene);
   if(scene.regions.has(cfg.id)||Array.from(scene.regions).some(r=>r.name===cfg.name||r.getFlag(NS,'cavLateBatch1')?.purpose===cfg.purpose))throw Error('Original fixture already installed: '+cfg.purpose);
   const c=cfg.box;
   if(![c.x,c.y,c.width,c.height].every(Number.isFinite)||c.width<30||c.height<30||
      c.x<0||c.y<0||c.x+c.width>scene.width||c.y+c.height>scene.height)throw Error('Unsafe fixture geometry '+cfg.scene);
   // Cross-check overlap with any existing Region's rectangle (preserve originals).
   const overlaps=Array.from(scene.regions).flatMap(r=>Array.from(r.shapes||[]).filter(s=>s.type==='rectangle'&&
       Math.max(c.x,s.x)<Math.min(c.x+c.width,s.x+s.width)&&
       Math.max(c.y,s.y)<Math.min(c.y+c.height,s.y+s.height)).map(s=>({id:r.id,name:r.name})));
   if(overlaps.length)throw Error('Overlaps existing Region '+cfg.scene+' '+JSON.stringify(overlaps));
   if(Array.from(scene.tokens).some(t=>t.x<c.x+c.width&&t.x+t.width*scene.grid.size>c.x&&
      t.y<c.y+c.height&&t.y+t.height*scene.grid.size>c.y))
    throw Error('Actor token currently overlaps proposed fixture: '+cfg.scene);
   docs.push({scene:cfg.scene,approvedBackground:cfg.art,regionId:cfg.id,
     name:cfg.name,rect:cfg.box,purpose:cfg.purpose,existingRegionCount:scene.regions.size});
  }
  if(!commit)return {world:game.world.id,gm:game.user.name,
    status:'preflight-pass-no-writes',regions:docs};
  const created=[];
  for(const cfg of plan){
   const scene=game.scenes.get(cfg.scene);
   const shape={type:'rectangle',x:cfg.box.x,y:cfg.box.y,width:cfg.box.width,height:cfg.box.height,rotation:0,hole:false};
   const source={_id:cfg.id,name:cfg.name,color:'#76634c',visibility:0,
     shapes:[shape],behaviors:[],
     flags:{[NS]:{cavLateBatch1:{status:'physical-fixture-staged',source:'2026-10-26-owner-live-batch1',purpose:cfg.purpose,basis:cfg.basis}}}};
   const made=await scene.createEmbeddedDocuments('Region',[source],{keepId:true});
   const r=scene.regions.get(cfg.id);
   if(made.length!==1||!r||r.name!==cfg.name||r.behaviors.size!==0||
      r.getFlag(NS,'cavLateBatch1')?.purpose!==cfg.purpose)
    throw Error('Partial Region write on '+cfg.scene+'; do not retry without reconciliation');
   created.push({sceneId:scene.id,sceneName:scene.name,regionId:r.id,uuid:r.uuid,
      regionName:r.name,shape:r.toObject().shapes,behaviors:r.behaviors.size,
      flag:r.getFlag(NS,'cavLateBatch1')});
  }
  return {world:game.world.id,gm:game.user.name,status:'two-original-physical-regions-created-verified-no-behaviors',created};
 },{plan,commit,NS});
 writeFileSync(out,JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{await b.close();}