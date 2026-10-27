import{chromium}from'playwright-core';import{writeFileSync}from'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
const x=await p.evaluate(()=>{if(!game.ready||game.world.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('GM');
const j=game.journal.get('9dngVaa6ctgFAqd2');
return{journal:j?.name,pages:j?.pages.contents.map(p=>({id:p.id,name:p.name,type:p.type,content:p.text?.content??p.text?.markdown??'',
plain:String(p.text?.content??p.text?.markdown??'').replace(/<[^>]*>/g,' ').replace(/\s+/g,' ').trim()}))};
});
writeFileSync('C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-ambience-area-readaloud-all-59-pages.json',JSON.stringify(x,null,2));
console.log(JSON.stringify({journal:x.journal,pageCount:x.pages.length,pages:x.pages.map(z=>({name:z.name,size:z.plain.length,preview:z.plain.slice(0,230)}))}).slice(0,19000));
}finally{await b.close()}