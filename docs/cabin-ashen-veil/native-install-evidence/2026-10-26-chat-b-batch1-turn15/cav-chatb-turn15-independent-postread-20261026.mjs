import{chromium}from'playwright-core';import{pathToFileURL}from'node:url';import{writeFileSync}from'node:fs';
const {SG01_SCENE,SG01_REGIONS,SG01_MAP,sourceForSG01}=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-sg01-staged-regions.js').href);
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('Exact game missing');
 const report=await p.evaluate(({SG01_SCENE,SG01_REGIONS,SG01_MAP,expected})=>{
 const ns='dicebox-campaign-helper';
 if(!game?.ready||game.world?.id!=='cabin-in-the-ashen-veil'||!game.user?.isGM||
 game.users?.activeGM?.id!==game.user.id)throw Error('Wrong elected GM');
 const s=game.scenes.get(SG01_SCENE);
 const checks=SG01_REGIONS.map((cfg,i)=>{
  const r=s?.regions.get(cfg.id),b=r?.behaviors.get(cfg.behavior),sh=r?.toObject().shapes[0];
  return {kind:cfg.kind,uuid:r?.uuid,behaviorUuid:b?.uuid,behaviorCount:r?.behaviors.size,
   sourceMatches:b?.system.source?.trim()===expected[i],
   status:r?.getFlag(ns,'cavLateSG01')?.status,
   isDisabled:b?.disabled===true,behaviorEvents:Array.from(b?.system.events||[]),
   shapeMatches:JSON.stringify([sh?.x,sh?.y,sh?.width,sh?.height])===
    JSON.stringify([cfg.rect.x,cfg.rect.y,cfg.rect.width,cfg.rect.height]),
   claimState:r?.getFlag(ns,'cavLateSilverRecoverableMarker')??null};
 });
 const first=game.scenes.get('CAVAQ01Scene0001')?.regions.get('woZ98KXx0RsWIPpl');
 const originals={
  nwWinderActive:s.regions.get('gksvZIqj8jWdqzn7')?.behaviors.get('7nHv3rf66mG8PJJS')?.disabled===false,
  firstChaseDisabled:first?.behaviors.get('CAVAQCHASETRIG01')?.disabled===true,
  firstChaseNotTriggered:!first?.getFlag(ns,'cavFirstAqueductChase'),
  studioVanityPreserved:!!game.scenes.get('CAVHU07Scene0001')?.regions.get('CAVVANITYREG0001'),
  hopeBehaviorStillEnabled:game.scenes.get('CAVHU04Scene0001')?.regions.get('CAVHU04HOPECHST1')?.behaviors.get('CAVHOPECHSTBEH01')?.disabled===false,
  silverSourceWorldCount:Array.from(game.items).filter(i=>i.uuid==='Item.IY8fuUG5P0yWIZIh').length,
  silverActorCopies:Array.from(game.actors).flatMap(a=>Array.from(a.items).filter(i=>i.name==='Silver Tiny Key')).length
 };
 const pass=s?.background.src===SG01_MAP&&checks.every(x=>x.sourceMatches&&x.status==='dormant-uncommissioned'&&x.isDisabled&&x.behaviorCount===1&&x.shapeMatches&&x.claimState===null)&&
 Object.values(originals).slice(0,5).every(Boolean)&&originals.silverSourceWorldCount===1&&originals.silverActorCopies===0;
 return{pass,world:game.world.id,checks,originals};
 },{SG01_SCENE,SG01_REGIONS,SG01_MAP,expected:SG01_REGIONS.map(r=>sourceForSG01(r.kind))});
 const dest='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn15-independent-postread-20261026.json';
 writeFileSync(dest,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 if(!report.pass)throw Error('Live SG01 staging postread mismatch');
}finally{await b.close()}