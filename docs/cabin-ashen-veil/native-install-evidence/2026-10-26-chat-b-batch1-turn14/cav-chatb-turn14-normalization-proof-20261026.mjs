import{chromium}from'playwright-core';import{pathToFileURL}from'node:url';import{createHash}from'node:crypto';
const {nativeBatch1Script}=await import(pathToFileURL('C:/Users/rujie/Documents/CAV-Chat-B-Late-Game/modules/regionwright/scripts/studio-cav-late-batch1-native-region-scripts.js').href);
const expected=nativeBatch1Script('hope'),trimmed=expected.trim();
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
 const result=await p.evaluate(()=>{if(!game?.user?.isGM||game.users.activeGM.id!==game.user.id)throw Error('bad GM');
 const b=game.scenes.get('CAVHU04Scene0001')?.regions.get('CAVHU04HOPECHST1')?.behaviors.get('CAVHOPECHSTBEH01');
 return {source:b?.system?.source,type:b?.type,disabled:b?.disabled,events:Array.from(b?.system?.events||[])}});
 const cryptoHash=s=>createHash('sha256').update(s).digest('hex');
 console.log(JSON.stringify({nativeSourceLen:result.source?.length,expectedLen:expected.length,trimmedLen:trimmed.length,
  exactUntrimmed:expected===result.source,exactTrim:trimmed===result.source,
  nativeHash:cryptoHash(result.source??''),trimmedHash:cryptoHash(trimmed),
  type:result.type,disabled:result.disabled,events:result.events}));
 if(trimmed!==result.source)throw Error('Unknown source mismatch; STOP');
}finally{await b.close()}