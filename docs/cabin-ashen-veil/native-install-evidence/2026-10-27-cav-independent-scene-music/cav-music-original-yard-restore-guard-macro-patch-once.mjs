import{chromium}from'playwright-core';import{pathToFileURL}from'node:url';
import{readFileSync,writeFileSync}from'node:fs';import{createHash}from'node:crypto';
const cfg=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-early-map-music-47.js').href);
const before=JSON.parse(readFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-early-map-music-47-native-originals-preflight.json','utf8'));
const newCommand=cfg.macroCommand(before.entries,before.originals);
const newHash=createHash('sha256').update(newCommand).digest('hex');
new (Object.getPrototypeOf(async function(){}).constructor)(newCommand);
if(!newCommand.includes('await sc.sounds.get(row.soundId).unsetFlag(ns,key);'))
 throw Error('Original Yard restore patch absent');
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
const data=await p.evaluate(async({oldHash,newHash,newCommand})=>{
 const ns='dicebox-campaign-helper',key='cavEarlyMapMusicV1';
 if(!game.ready||game.version!=='14.367'||game.world.id!=='cabin-in-the-ashen-veil'||
 !game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('Not elected GM');
 const m=game.macros.get('CAVMUSICGM000001'),f=m?.getFlag(ns,key);
 if(!m||f?.macroSourceSHA256!==oldHash||f.status!=='installed'||
 f.pending!==null||f.lastVerified!==47||game.scenes.size!==47||
 game.scenes.contents.reduce((n,s)=>n+s.sounds.size,0)!==57||
 m.command.includes('await sc.sounds.get(row.soundId).unsetFlag(ns,key);'))
 throw Error('Current original music macro contract changed; no patch');
 const patch={_id:m.id,command:newCommand,
  ['flags.'+ns+'.'+key+'.macroSourceSHA256']:newHash,
  ['flags.'+ns+'.'+key+'.safeYardRestoreOriginalFlagClear']:true};
 const docs=await getDocumentClass('Macro').updateDocuments([patch]);
 const actual=game.macros.get('CAVMUSICGM000001');
 if(docs.length!==1||actual.command!==newCommand||
 actual.getFlag(ns,key)?.macroSourceSHA256!==newHash||
 actual.getFlag(ns,key)?.pending!==null||
 actual.getFlag(ns,key)?.status!=='installed')
 throw Error('Macro source patch uncertain; independently inspect');
 return{updated:true,world:game.world.id,id:actual.id,
  status:actual.getFlag(ns,key)?.status,priorSHA:oldHash,newSHA:newHash,
  sceneSoundCount:game.scenes.contents.reduce((n,s)=>n+s.sounds.size,0),
  codeLength:actual.command.length};
},{oldHash:before.macroSHA256,newHash,newCommand});
writeFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-music-macro-restore-guard-update-receipt.json',JSON.stringify(data,null,2));
console.log(JSON.stringify(data));
}finally{await b.close()}