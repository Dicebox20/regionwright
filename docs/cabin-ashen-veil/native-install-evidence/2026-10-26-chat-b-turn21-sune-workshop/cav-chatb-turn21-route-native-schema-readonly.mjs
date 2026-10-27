import{chromium}from'playwright-core';
const b=await chromium.connectOverCDP('http://127.0.0.1:9224');
try{const page=b.contexts().flatMap(c=>c.pages()).find(p=>p.url()==='http://127.0.0.1:30000/game');
const x=await page.evaluate(()=>{
 if(!game.ready||game.world.id!=='cabin-in-the-ashen-veil'||!game.user.isGM||game.users.activeGM.id!==game.user.id)throw Error('GM');
 const z=game.scenes.get('CAVHU07Scene0001').regions.get('VM6Kcyhrhgh55uFJ').behaviors.get('4Yqj8PlTMqwQTKSm');
 return{type:z.type,system:z.toObject().system,disabled:z.disabled,regionData:z.parent.toObject(),world:game.world.id};
});console.log(JSON.stringify({type:x.type,system:x.system,disabled:x.disabled,region: {visibility:x.regionData.visibility,color:x.regionData.color,shape:x.regionData.shapes[0],behaviorCount:x.regionData.behaviors.length}}))}finally{await b.close()}