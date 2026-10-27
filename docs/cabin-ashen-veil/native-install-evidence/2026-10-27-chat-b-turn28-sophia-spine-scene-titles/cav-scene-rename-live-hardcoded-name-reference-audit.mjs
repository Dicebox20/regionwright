import{chromium}from'playwright-core';import{writeFileSync}from'node:fs';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const p=b.contexts().flatMap(c=>c.pages()).find(x=>x.url()==='http://127.0.0.1:30000/game');
if(!p)throw Error('GM tab unavailable');
const r=await p.evaluate(()=>{
if(!game.ready||game.world.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||
game.users.activeGM.id!==game.user.id)throw Error('Wrong GM');
const all=game.scenes.contents.map(s=>({id:s.id,uuid:s.uuid,name:s.name,
 navigation:s.navigation,sort:s.sort,active:s.active,background:s.background.src,
 flags:s.flags}));
const candidates=[];
const names=all.map(x=>x.name);
for(const s of game.scenes.contents)for(const reg of s.regions.contents)
 for(const bh of reg.behaviors.contents)if(bh.type==='executeScript'){
 const source=bh.system?.source||'';
 const hits=[];
 const regexes=[
 /(?:scene|game\.scenes\.(?:get|current)|canvas\.scene|\bsc|\btargetScene)\??\.name\s*(?:===|!==|==|!=)\s*['"][^'"]+['"]/g,
 /(?:\.name|sceneName)\s*(?:===|!==|==|!=)\s*['"][^'"]+['"]/g,
 /game\.scenes\.(?:getName|findName)\s*\(/g
 ];
 for(const re of regexes){for(const m of source.matchAll(re))hits.push(m[0]);}
 for(const name of names){if(source.includes(name))hits.push('EXACT_SAVED_SCENE_TITLE:'+name);}
 if(hits.length)candidates.push({scene:s.id,region:reg.id,behavior:bh.id,disabled:bh.disabled,name:bh.name,hits:[...new Set(hits)]});
 }
return{world:game.world.id,scenes:all,hardcodedNameCandidates:candidates,
 actorCount:game.actors.size,currentUsers:game.users.contents.map(u=>({name:u.name,isGM:u.isGM,active:u.active,viewedScene:u.viewedScene})),
 settingWorldLanguage:game.settings.get('core','language')};
});
const path='C:/Users/rujie/AppData/Local/Programs/Chrome for Testing Dev/utility-harness/artifacts/cav-scene-rename-live-hardcoded-name-reference-audit.json';
writeFileSync(path,JSON.stringify(r,null,2));
console.log(JSON.stringify({scenes:r.scenes.map(x=>({id:x.id,name:x.name})),
hardcodedNameCandidates:r.hardcodedNameCandidates,users:r.currentUsers}).slice(0,17000));
}finally{await b.close()}