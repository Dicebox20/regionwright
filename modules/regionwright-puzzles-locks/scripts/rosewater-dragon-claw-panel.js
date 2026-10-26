import{createRosewaterCampaignConfig}from"./rosewater-campaign-preset.js";
const rootFor=app=>app?.element?.[0]??app.element;
const safe=s=>String(s??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;");
const rings=["outer","middle","inner"];
const css=[
".rw-claw{color:#e6d4b9;text-align:center;font-family:serif}.rw-claw h2{color:#e4c99d;margin:.2rem}.rw-claw p{margin:.45rem}",
".rw-claw-door{width:min(400px,82vw);aspect-ratio:1;position:relative;margin:16px auto;border-radius:50%;background:#191d27;box-shadow:0 0 0 8px #55473a,0 0 0 13px #bca475,0 12px 34px #000c}",
".rw-claw-ring{position:absolute;border-radius:50%;left:50%;top:50%;transform:translate(-50%,-50%) rotate(var(--angle));border:5px ridge #ac9066;background:repeating-conic-gradient(#272934 0deg 15deg,#35333c 15deg 29deg,#20262d 29deg 45deg);box-shadow:inset 0 0 15px #000c;cursor:pointer;transition:transform .25s ease}",
".rw-claw-ring.outer{width:99%;height:99%;z-index:1}.rw-claw-ring.middle{width:69%;height:69%;z-index:2}.rw-claw-ring.inner{width:40%;height:40%;z-index:3}",
".rw-claw-glyph{position:absolute;display:grid;place-items:center;min-width:24px;min-height:24px;padding:3px 5px;max-width:33%;font-size:10px;line-height:1.1;color:#f3e1ba;text-transform:uppercase;overflow:hidden;border-radius:50%;border:2px solid #bc9962;background:radial-gradient(circle,#654f3c,#24232b);transform:translate(-50%,-50%);pointer-events:none}",
".rw-claw-glyph:nth-child(1){left:50%;top:8%}.rw-claw-glyph:nth-child(2){left:8%;top:50%}.rw-claw-glyph:nth-child(3){left:50%;top:92%}.rw-claw-glyph:nth-child(4){left:92%;top:50%}",
".rw-claw-marker{position:absolute;z-index:6;top:-11px;left:50%;transform:translateX(-50%);color:#ffd58a;text-shadow:0 0 12px #000;font-size:28px;pointer-events:none}",
".rw-claw-seal{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);z-index:7;width:17%;height:17%;min-width:47px;min-height:47px;border-radius:50%;border:4px ridge #d0aa79;background:radial-gradient(circle,#9b6475,#423545);color:#fff4d5;font-size:23px;cursor:pointer}",
".rw-claw-controls{display:flex;justify-content:space-between;align-items:center;max-width:430px;gap:7px;margin:6px auto}.rw-claw-controls strong{flex:1}",
".rw-claw-controls button,.rw-claw-footer button{background:#37323b;border:1px solid #c7a977;color:#f9e6c5;border-radius:5px;padding:6px 10px;cursor:pointer}.rw-claw-ring:hover,.rw-claw-ring:focus-visible{outline:3px solid #e8bf76}",
".rw-claw-controls button:hover,.rw-claw-footer button:hover{background:#605165}"
].join("");
export function renderCavRosewaterClawPanel(symbols,positions=[0,0,0],message=""){
 const config=createRosewaterCampaignConfig({symbols});
 if(!Array.isArray(positions)||positions.length!==3||positions.some(x=>!Number.isInteger(x)||x<0||x>3))throw Error("Invalid GM ring position state");
 const circles=rings.map((ring,i)=>'<div class="rw-claw-ring '+ring+'" data-claw-ring="'+ring+'" tabindex="0" role="button" aria-label="Rotate '+ring+' ring clockwise" style="--angle:'+(positions[i]*90)+'deg">'+config.symbols.map(s=>'<span class="rw-claw-glyph">'+safe(s)+'</span>').join("")+'</div>').join("");
 const controls=rings.map(r=>'<div class="rw-claw-controls"><button type="button" data-claw-rotate="'+r+'" data-direction="-1" aria-label="Rotate '+r+' counterclockwise">↶</button><strong>'+r.toUpperCase()+' RING</strong><button type="button" data-claw-rotate="'+r+'" data-direction="1" aria-label="Rotate '+r+' clockwise">↷</button></div>').join("");
 return '<section class="rw-claw" aria-label="Rosewater three-ring dragon-claw style lock"><h2>Rosewater Reliquary</h2><p>Rotate each ring independently. Align its glyph beneath the fixed gold marker and press the central seal.</p><div class="rw-claw-door"><span class="rw-claw-marker" aria-hidden="true">◆</span>'+circles+'<button class="rw-claw-seal" type="button" data-claw-submit aria-label="Press central Rosewater seal">✧</button></div>'+controls+'<div class="rw-claw-footer"><button type="button" data-claw-reset>Reset rings</button></div><p role="status" aria-live="polite">'+safe(message||"The three rings wait in silence.")+'</p></section>';
}
export async function openCavRosewaterCampaignPuzzle({region,symbols,readState,onAction}={}){
 if(!region||typeof readState!=="function"||typeof onAction!=="function")throw Error("Rosewater Region and elected GM callback required");
 const config=createRosewaterCampaignConfig({symbols});
 const DialogV2=globalThis.foundry?.applications?.api?.DialogV2;
 if(!DialogV2)throw Error("Foundry DialogV2 unavailable");
 if(!document.getElementById("rw-cav-claw-style")){const tag=document.createElement("style");tag.id="rw-cav-claw-style";tag.textContent=css;document.head.appendChild(tag)}
 const current=()=>{const s=readState();return Array.isArray(s?.positions)&&s.positions.length===3&&s.positions.every(x=>Number.isInteger(x)&&x>=0&&x<=3)?s.positions:[0,0,0]};
 class RosewaterClawDialog extends DialogV2{
  constructor(){super({classes:["regionwright","rw-claw-dialog"],window:{title:"Rosewater Reliquary — Three Rings",resizable:true},position:{width:570,height:790},content:renderCavRosewaterClawPanel(config.symbols,current()),buttons:[{action:"close",label:"Close"}]});this.hookId=null;this.sending=false}
  _onRender(c,o){super._onRender(c,o);const el=rootFor(this);
   if(!this.hookId)this.hookId=Hooks.on("updateRegion",r=>{if(r.id===region.id&&r.parent?.id===region.parent?.id)this.refresh("The stone rings grind into place.")});
   if(el&&!el.dataset.cavClawBound){el.dataset.cavClawBound="true";
    el.addEventListener("click",async e=>{
     const rotate=e.target.closest?.("[data-claw-rotate]"),ring=e.target.closest?.("[data-claw-ring]"),reset=e.target.closest?.("[data-claw-reset]"),submit=e.target.closest?.("[data-claw-submit]");
     if(!rotate&&!ring&&!reset&&!submit||this.sending)return;
     const s=readState()??{revision:0,status:"unsolved"};
     if(s.status==="done"){this.refresh("The center seal has already released.");return}
     if(s.status==="reserved"){this.refresh("The rings await Gamemaster reconciliation.");return}
     if(!Number.isInteger(s.revision)){this.refresh("The ring ledger needs Gamemaster attention.");return}
     const req=rotate?{op:"rotate",ring:rotate.dataset.clawRotate,direction:Number(rotate.dataset.direction)}:
       ring?{op:"rotate",ring:ring.dataset.clawRing,direction:1}:
       reset?{op:"reset"}:{op:"submit"};
     this.sending=true;
     try{await onAction({...req,expectedRevision:s.revision});this.refresh("The Gamemaster is verifying the movement.")}
     catch(error){console.error("[CAV Rosewater] request failed",error);this.refresh("The mechanism did not respond. Ask the Gamemaster.")}
     finally{this.sending=false}
    });
    el.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){const ring=e.target.closest?.("[data-claw-ring]");if(ring){e.preventDefault();ring.click()}}});
   }
  }
  _onClose(options){if(this.hookId){Hooks.off("updateRegion",this.hookId);this.hookId=null}return super._onClose(options)}
  refresh(message=""){const area=rootFor(this)?.querySelector(".rw-claw");if(area)area.outerHTML=renderCavRosewaterClawPanel(config.symbols,current(),message)}
 }
 const dialog=new RosewaterClawDialog();await dialog.render({force:true});return dialog;
}
