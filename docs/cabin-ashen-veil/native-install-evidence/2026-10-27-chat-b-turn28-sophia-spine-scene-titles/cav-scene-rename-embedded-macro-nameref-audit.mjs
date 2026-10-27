import{chromium}from'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
const r=await p.evaluate(()=>{
 if(!game.ready||game.world?.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('wrong GM');
 const scenes=game.scenes.contents.map(s=>s.name);
 const macros=game.macros.contents.map(m=>({id:m.id,name:m.name,type:m.type,code:String(m.command||'')}))
 .filter(m=>scenes.some(n=>m.code.includes(n))||
 /(?:game\.scenes\.getName|game\.scenes\.find|\.name\s*===\s*['"]H-|\.name\s*===\s*['"]EXT-)/i.test(m.code))
 .map(m=>({id:m.id,name:m.name,type:m.type,matchedNames:scenes.filter(n=>m.code.includes(n)),codeSnippet:m.code.slice(0,500)}));
 return{macroCount:game.macros.size,hardcodedMacroSceneNames:macros,
 sceneClassStaticUpdate:typeof getDocumentClass('Scene')?.updateDocuments,
 currentPlayerUsers:game.users.contents.filter(u=>u.active).map(u=>({name:u.name,isGM:u.isGM,scene:u.viewedScene}))};
});
console.log(JSON.stringify(r).slice(0,4900));
}finally{await b.close()}