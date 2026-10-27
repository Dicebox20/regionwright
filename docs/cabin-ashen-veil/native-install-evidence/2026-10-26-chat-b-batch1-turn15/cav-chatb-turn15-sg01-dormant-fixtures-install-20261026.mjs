import{chromium}from'playwright-core';
import{pathToFileURL}from'node:url';
import{writeFileSync}from'node:fs';
import{createHash}from'node:crypto';
const {SG01_REGIONS,SG01_SCENE,SG01_MAP,SG01_NW_WINDER,sourceForSG01}=await import(
 pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-sg01-staged-regions.js').href);
const commit=process.argv.includes('--install-disabled-sg01-fixtures');
const plans=SG01_REGIONS.map(x=>({...x,source:sourceForSG01(x.kind),
 hash:createHash('sha256').update(sourceForSG01(x.kind)).digest('hex')}));
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const page=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!page)throw Error('GM browser unavailable');
 const receipt=await page.evaluate(async ({plans,commit,SG01_SCENE,SG01_MAP,SG01_NW_WINDER})=>{
   const ns='dicebox-campaign-helper';
   if(!game?.ready||game.world?.id!=='cabin-in-the-ashen-veil'||
      !game.user?.isGM||game.users?.activeGM?.id!==game.user.id)
    throw Error('Wrong world/elected GM');
   const scene=game.scenes.get(SG01_SCENE);
   if(!scene||scene.background.src!==SG01_MAP||scene.width!==4320||scene.height!==2880)
    throw Error('Approved owner Grove source changed');
   const original=scene.regions.get(SG01_NW_WINDER),
         b=original?.behaviors.get('7nHv3rf66mG8PJJS');
   if(!original||!b||b.type!=='executeScript'||b.disabled!==false)
    throw Error('Original NW Winder not verified; never override');
   const first=game.scenes.get('CAVAQ01Scene0001')?.regions.get('woZ98KXx0RsWIPpl');
   if(first?.behaviors.get('CAVAQCHASETRIG01')?.disabled!==true||
      first.getFlag(ns,'cavFirstAqueductChase'))
    throw Error('First chase stage changed; STOP and reconcile');
   const source=game.items.get('IY8fuUG5P0yWIZIh');
   if(!source||source.uuid!=='Item.IY8fuUG5P0yWIZIh'||source.name!=='Silver Tiny Key'||
     source.getFlag(ns,'cabinPuzzleItem')?.status!=='GM_LIBRARY_ONLY')
    throw Error('Original Silver item source changed');
   const checks=plans.map(c=>{
      if(scene.regions.has(c.id)||Array.from(scene.regions).some(r=>
        r.getFlag(ns,'cavLateSG01')?.kind===c.kind))throw Error('Already installed');
      const {x,y,width,height}=c.rect;
      if(x<0||y<0||x+width>scene.width||y+height>scene.height)throw Error('Region out of bounds');
      const collisions=[];
      for(const r of scene.regions){
       for(const sh of r.toObject().shapes){
        if(sh.type==='rectangle'){
         if(x<sh.x+sh.width&&x+width>sh.x&&y<sh.y+sh.height&&y+height>sh.y)collisions.push(r.id);
        }else if(sh.type==='polygon'){
         const pts=sh.points,bx=Math.min(...pts.filter((_,i)=>i%2===0)),
          mx=Math.max(...pts.filter((_,i)=>i%2===0)),
          by=Math.min(...pts.filter((_,i)=>i%2===1)),
          my=Math.max(...pts.filter((_,i)=>i%2===1));
         if(x<mx&&x+width>bx&&y<my&&y+height>by)collisions.push(r.id);
        }
       }
      }
      if(collisions.length)throw Error('Overlapping owner Region: '+JSON.stringify(collisions));
      if(Array.from(scene.tokens).some(t=>t.x<x+width&&t.x+t.width*scene.grid.size>x&&t.y<y+height&&t.y+t.height*scene.grid.size>y))
       throw Error('Player token currently on fixture target');
      if(!c.source.includes('firstChaseReceiptVerified!==true')||
         !c.source.includes('crookedManActorAndEncounterVerified!==true'))
       throw Error('Guard missing');
      return {kind:c.kind,id:c.id,behavior:c.behavior,rect:c.rect,sourceHash:c.hash};
   });
   if(!commit)return{status:'staging-preflight-pass-no-world-writes',
     sourceScene:SG01_SCENE,firstChaseStillDisabled:true,
     originalWinderIntact:true,checked:checks};
   const installed=[];
   for(const c of plans){
      const made=await scene.createEmbeddedDocuments('Region',[{
       _id:c.id,name:c.title,color:'#978673',visibility:0,
       shapes:[{type:'rectangle',x:c.rect.x,y:c.rect.y,width:c.rect.width,height:c.rect.height,rotation:0,hole:false}],
       behaviors:[{_id:c.behavior,name:c.kind+' — DISABLED, upstream blocked',type:'executeScript',
         disabled:true,system:{events:['tokenMoveIn','tokenMoveWithin'],source:c.source}}],
       flags:{[ns]:{cavLateSG01:{version:1,status:'dormant-uncommissioned',kind:c.kind,
         source:'2026-10-26-approved-owner-SG01-art',required:['first-chase','waterworks','allen-warning','crooked-man']}}}
      }],{keepId:true});
      const region=scene.regions.get(c.id),beh=region?.behaviors.get(c.behavior);
      if(made.length!==1||!region||!beh||beh.disabled!==true||
         beh.system.source.trim()!==c.source.trim()||
         region.getFlag(ns,'cavLateSG01')?.status!=='dormant-uncommissioned')
       throw Error('Partially staged Region: STOP, no automatic rerun');
      installed.push({id:region.id,uuid:region.uuid,behavior:beh.uuid,disabled:beh.disabled,
        status:region.getFlag(ns,'cavLateSG01').status,shapes:region.toObject().shapes});
   }
   return{status:'two-dormant-owner-art-grove-regions-verified',sourceScene:SG01_SCENE,installed};
 },{plans,commit,SG01_SCENE,SG01_MAP,SG01_NW_WINDER});
 const out='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn15-sg01-fixtures-20261026.json';
 writeFileSync(out,JSON.stringify(receipt,null,2));console.log(JSON.stringify(receipt));
}finally{await b.close()}