// Cabin in the Ashen Veil — SRD placeholder artwork mapper (preview before write).
// Active-GM/world gated. Does not create items, modify mechanics or overwrite approved art.
const WORLD='cabin-in-the-ashen-veil';
const PLACEHOLDERS=new Set(['icons/containers/bags/pouch-leather-brown.webp','icons/svg/item-bag.svg','icons/svg/item.svg','']);
if(game.world?.id!==WORLD||!game.user?.isGM||game.users.activeGM?.id!==game.user.id){ui.notifications.error('Run as active GM in Cabin in the Ashen Veil.');return;}
const folder=game.folders.find(f=>f.type==='Item'&&f.name.startsWith('Cabin in the Ashen Veil'));
if(!folder){ui.notifications.warn('Cabin puzzle-items folder missing.');return;}
const items=game.items.filter(i=>i.folder?.id===folder.id&&PLACEHOLDERS.has(i.img||''));
if(!items.length){ui.notifications.info('No items with default placeholder artwork.');return;}
const packs=['dnd5e.items','dnd5e.equipment24','dnd5e.tradegoods'].map(id=>game.packs.get(id)).filter(Boolean);
const candidates=[];
for(const p of packs){const idx=await p.getIndex({fields:['img']});for(const entry of idx){if(entry.img&&!PLACEHOLDERS.has(entry.img)&&!entry.img.startsWith('icons/svg/'))candidates.push({name:entry.name,img:entry.img,pack:p.collection});}}
const normalize=s=>String(s).toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9 ]/g,' ').replace(/\s+/g,' ').trim();
// Visual analogues, NOT item identity claims. Avoid assigning magical item powers.
const hints=[
 [/key/i,['Key']], [/clock.*hand|minute hand|hour hand/i,['Rod','Wand']],
 [/gear|winder|crank|handle/i,['Whetstone','Hammer']],
 [/emblem|power source/i,['Holy Symbol','Amulet']],
 [/dust of dryness/i,['Dust of Disappearance','Dust of Sneezing and Choking']],
 [/journal|book/i,['Book','Spellbook']],
 [/hook/i,['Grappling Hook']], [/mirror/i,['Steel Mirror']],
 [/lye|plant killer/i,['Acid (Vial)','Oil']],
 [/bowl/i,['Bowl']], [/oars?/i,['Quarterstaff']],
 [/prayer/i,['Book','Holy Symbol']]
];
function score(item,c){const n=normalize(item.name),t=normalize(c.name);if(n===t)return 100;const words=n.split(' ').filter(w=>w.length>=4);let score=words.reduce((v,w)=>v+(t.split(' ').includes(w)?8:0),0);if(t.includes(n)&&n.length>=5)score+=40;for(const [pattern,names] of hints)if(pattern.test(item.name)){names.forEach((h,i)=>{if(t===normalize(h))score=Math.max(score,70-i*9);});break;}if(/\+\d|vicious|legendary|of (fire|frost|power)/i.test(c.name))score-=30;return score;}
const plan=items.map(item=>{const ranked=candidates.map(c=>({...c,score:score(item,c)})).filter(c=>c.score>=30).sort((a,b)=>b.score-a.score||a.name.localeCompare(b.name));return{item,best:ranked[0]||null};});
const escape=s=>foundry.utils.escapeHTML(String(s));
const rows=plan.map(({item,best})=>`<tr><td>${escape(item.name)}</td><td>${best?`<img src="${escape(best.img)}" width="32" height="32" style="vertical-align:middle"> ${escape(best.name)}`:'No reliable SRD match'}</td><td>${best?escape(best.pack):'Skip'}</td></tr>`).join('');
const approved=plan.filter(x=>x.best);
const yes=await foundry.applications.api.DialogV2.confirm({window:{title:'Cabin — SRD artwork preview'},content:`<p>${plan.length} placeholder items; ${approved.length} proposed replacements, ${plan.length-approved.length} skipped. This updates image paths ONLY and will not replace approved artwork.</p><div style="max-height:480px;overflow:auto"><table><thead><tr><th>Item</th><th>Closest SRD image</th><th>Source</th></tr></thead><tbody>${rows}</tbody></table></div><p>Apply these proposals?</p>`,rejectClose:false});
if(!yes){ui.notifications.info('SRD artwork preview cancelled; no changes.');return;}
if(game.world?.id!==WORLD||game.users.activeGM?.id!==game.user.id)throw Error('GM/world changed');
const before=approved.map(({item,best})=>({id:item.id,name:item.name,old:item.img,new:best.img,source:best.pack}));
console.info('[Cabin SRD artwork] PREWRITE receipt',before);
let changed=0;for(const {item,best} of approved){if(!PLACEHOLDERS.has(item.img||''))continue;await item.update({img:best.img});if(item.img!==best.img)throw Error('Verification failed: '+item.name);changed++;}
console.info('[Cabin SRD artwork] VERIFIED',JSON.stringify({world:WORLD,changed,previous:before}));ui.notifications.info(`Applied ${changed} SRD images. Details in console.`);
