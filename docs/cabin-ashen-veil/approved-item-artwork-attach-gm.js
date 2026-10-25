// Owner-approved Cabin art attachment. Run only in the intended Foundry world as ACTIVE GM.
// Updates artwork only, never changes item mechanics or creates documents.
(async()=>{
const expected='cabin-in-the-ashen-veil';
if(game.world?.id!==expected||!game.user?.isGM||game.users?.activeGM?.id!==game.user.id)throw Error('Requires active GM in Cabin world');
const dir='worlds/cabin-in-the-ashen-veil/assets/puzzle-items-approved/';
const rows=[
  {file:'Aqueduct_Gate_Handle.png',names:['Aqueduct Gate Handle']},
  {file:'Ornate_Music_Box.png',names:['Ornate Music Box']},
  {file:'Lantern_Oil.png',names:['Lantern Oil']},
  {file:'Rufus_Collar.png',names:['Rufus’s Collar',"Rufus's Collar"]},
  {file:'Prayer_of_Protection.png',names:['Prayer of Protection']},
  {file:'Prayer_of_Devotion.png',names:['Prayer of Devotion']},
  {file:'Rufus_First_Button_Eye.png',names:['Rufus’s First Glass Eye',"Rufus's First Glass Eye",'Rufus’s First Button Eye']},
  {file:'Rufus_Second_Button_Eye.png',names:['Rufus’s Second Glass Eye',"Rufus's Second Glass Eye",'Rufus’s Second Button Eye']},
  {file:'Wooden_Oar.png',names:['Wooden Oar']}
];
const plan=rows.map(r=>({...r,matches:game.items.filter(i=>r.names.includes(i.name))}));
const conflicts=plan.filter(r=>r.matches.length>1);
if(conflicts.length)throw Error('Ambiguous item matches: '+conflicts.map(r=>r.file).join(', '));
const changes=plan.filter(r=>r.matches.length===1).map(r=>({item:r.matches[0],file:r.file,old:r.matches[0].img,img:dir+r.file}));
for(const entry of changes){const result=await fetch('/'+entry.img,{method:'HEAD'});if(!result.ok)throw Error('Missing server artwork '+entry.img+' '+result.status)}
const receipt={operation:'cav.approved-item-artwork.attach',world:expected,date:new Date().toISOString(),before:changes.map(x=>({id:x.item.id,name:x.item.name,old:x.old,next:x.img})),missing:plan.filter(r=>r.matches.length===0).map(r=>r.file),deferredTentative:['Carriage_Key.png','Brass_Tiny_Key.png','Old_Iron_Key.png','Weathered_Key.png']};
console.log('PREWRITE_RECEIPT',structuredClone(receipt));
for(const entry of changes){if(entry.old!==entry.img)await entry.item.update({img:entry.img})}
const failed=changes.filter(x=>x.item.img!==x.img);
if(failed.length)throw Error('Postwrite mismatch '+failed.map(x=>x.file).join(','));
console.log('ATTACHED_AND_VERIFIED',receipt);
return receipt;
})();
