import {chromium} from 'playwright-core';
import {pathToFileURL} from 'node:url';
import {writeFileSync} from 'node:fs';
import {createHash} from 'node:crypto';
const {nativeBatch1Script}=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-batch1-native-region-scripts.js').href);
const targets=[
 {kind:'wick',scene:'CAVHU08Scene0001',region:'CAVBE5639AEC2179',id:'CAVWICKSHELFBEH1',name:'Chat B late wick - GM guarded actions'},
 {kind:'lantern',scene:'CAVEXT05Scene001',region:'CAVEXT05LANTERN1',id:'CAVLANTERNBEH001',name:'Chat B late lantern - GM guarded actions'}
].map(t=>({...t,source:nativeBatch1Script(t.kind).trim()}));
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{
 const p=b.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
 if(!p)throw Error('Exact GM /game page missing');
 const res=await p.evaluate(async ({targets})=>{
  if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||game.version!=='14.367'||
     !game.user.isGM||game.users.activeGM?.id!==game.user.id)
    throw Error('Elected GM mismatch');
  const hopeful=game.scenes.get('CAVHU04Scene0001')?.regions.get('CAVHU04HOPECHST1')?.behaviors.get('CAVHOPECHSTBEH01');
  if(!hopeful||hopeful.type!=='executeScript'||hopeful.disabled!==false||
      hopeful.system.source?.length<9000)throw Error('Reconciled existing Hope behavior unexpectedly changed');
  for(const t of targets){
    const r=game.scenes.get(t.scene)?.regions.get(t.region);
    if(!r||r.behaviors.size!==0)throw Error('Target changed before followup '+t.kind);
  }
  const made=[];
  for(const t of targets){
   const r=game.scenes.get(t.scene).regions.get(t.region);
   const sources=[{_id:t.id,name:t.name,type:'executeScript',disabled:false,
      system:{events:['behaviorViewed','behaviorUnviewed','behaviorDeactivated','tokenMoveIn','tokenMoveWithin'],
        source:t.source}}];
   const result=await r.createEmbeddedDocuments('RegionBehavior',sources,{keepId:true});
   const b=r.behaviors.get(t.id);
   if(result.length!==1||!b||b.type!=='executeScript'||b.disabled||
      b.system.source!==t.source||r.behaviors.size!==1)
      throw Error('Partial followup Region install '+t.kind+'; halt for reconciliation');
   made.push({kind:t.kind,regionUuid:r.uuid,behaviorUuid:b.uuid,
      sourceLength:b.system.source.length,events:Array.from(b.system.events)});
  }
  return {world:game.world.id,gm:game.user.name,previousHopeId:hopeful.id,remainingInstalled:made};
 },{targets});
 const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-chatb-turn14-native-behavior-continuation-20261026.json';
 writeFileSync(path,JSON.stringify(res,null,2));console.log(JSON.stringify(res));
}finally{await b.close();}