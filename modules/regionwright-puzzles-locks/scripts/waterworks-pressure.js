import { createWaterworksPressureConfig, evaluateWaterworksPressure, adjustWaterworksValve, resetWaterworksPressure } from './waterworks-pressure-engine.js';
import {createCavBoilerConfig,resetCavBoiler} from "./cav-boiler-campaign-preset.js";
const escapeHTML = value => String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const rootFor = app => app?.element?.[0] ?? app?.element;
function renderPanel(config,state,message='') {
  const result=evaluateWaterworksPressure(config,state);
  const gauges=result.valves.map(v=>`<div class="rw-waterworks-valve rw-waterworks-${v.id}"><button type="button" class="rw-pressure-image-control" data-valve="${v.id}" data-step="1" aria-label="Adjust ${v.id} pressure" title="Click to adjust pressure"><img alt="${v.id} gauge and valve" src="modules/regionwright-puzzles-locks/assets/pressure-${config.variant}-${v.id}.png" /></button><strong>${v.id.toUpperCase()}</strong><div role="meter" aria-label="${v.id} pressure" aria-valuemin="0" aria-valuemax="5" aria-valuenow="${v.position}" class="rw-waterworks-gauge"><span style="height:${v.position*20}%"></span></div><div class="rw-waterworks-controls"><button type="button" data-valve="${v.id}" data-step="-1" aria-label="Decrease ${v.id}">−</button><output>${v.position}</output><button type="button" data-valve="${v.id}" data-step="1" aria-label="Increase ${v.id}">+</button></div></div>`).join('');
  const status=result.success?'Pressure balanced.':result.balanced?(config.variant === 'boiler'?'Boiler valves balanced.':'Pressure balanced; a blockage remains.'):config.variant === 'boiler'?'Adjust both boiler valves.':result.blockageCleared?'Flow path clear; adjust the valves.':'The line is obstructed.';
  const hotspots = result.valves.map((v,i)=>`<button type="button" class="rw-waterworks-hotspot rw-waterworks-hotspot--${v.id}" style="left:${(config.variant === "boiler" ? [16.5,75.5] : [26.8,38.6,50.8,62.4,73.5])[i]}%;top:${config.variant === "boiler" ? 54 : 38}%" data-valve="${v.id}" data-step="1" aria-label="Turn ${v.id} valve clockwise. Current pressure ${v.position} of 5" title="${v.id.toUpperCase()} valve: ${v.position}/5"></button>`).join("");
  return `<section class="rw-waterworks" aria-label="Waterworks pressure puzzle"><h2>${config.variant === "boiler" ? "Boiler Pressure" : "Waterworks Pressure"}</h2><p>${escapeHTML(message||status)}</p><div class="rw-waterworks-art-board rw-waterworks-art-board--${config.variant}" role="group" aria-label="${config.variant === "boiler" ? "Two boiler valves" : "Five pressure valves and two main flow controls"}"><div class="rw-waterworks-art-guide">${config.variant === "boiler" ? "Two boiler valves" : "Five upper valves • left intake • lower main control"}</div>${hotspots}<button type="button" class="rw-waterworks-hotspot rw-waterworks-intake" data-intake-toggle aria-label="Turn left supply valve" title="Intake supply" ${config.variant === "boiler" ? "hidden" : ""}></button><button type="button" class="rw-waterworks-hotspot rw-waterworks-main" data-main-toggle aria-label="Turn lower main valve" title="Main flow" ${config.variant === "boiler" ? "hidden" : ""}></button></div><div class="rw-waterworks-gauges">${gauges}</div><div class="rw-waterworks-actions"><button type="button" data-clear-blockage ${config.variant === "boiler" ? "hidden" : ""} ${state.blockageCleared?'disabled':''}>${state.blockageCleared?'Obstruction cleared':'Clear pipe obstruction (test)'}</button><button type="button" data-waterworks-check>Test pressure</button><button type="button" data-waterworks-reset>Reset test</button></div><p role="status" class="rw-waterworks-status">${escapeHTML(status)}</p></section>`;
}
export async function openStandaloneWaterworksPressurePuzzle({variant = "waterworks"} = {}) {
  const DialogV2=globalThis.foundry?.applications?.api?.DialogV2;
  if (!DialogV2) throw new Error('Foundry dialog API unavailable');
  const config=createWaterworksPressureConfig({variant});
  class WaterworksDialog extends DialogV2 {
    constructor(){super({classes:['regionwright','rw-waterworks-dialog'],window:{title: (variant === 'boiler' ? 'Boiler Pressure' : 'Waterworks Pressure') + ' (standalone test)',resizable:true},position:{width:750,height:530},content:renderPanel(config,resetWaterworksPressure(config)),buttons:[{action:'close',label:'Close'}]});this.state=resetWaterworksPressure(config);this.intakeOpen=false;this.mainOpen=false;}
    _onRender(context,options){super._onRender(context,options);const root=rootFor(this);root?.addEventListener('click',event=>{const valve=event.target.closest?.('[data-valve]');if(valve){this.state=adjustWaterworksValve(config,this.state,valve.dataset.valve,Number(valve.dataset.step));this.refresh();return;}if(event.target.closest?.('[data-intake-toggle]')){this.intakeOpen=!this.intakeOpen;this.refresh(this.intakeOpen?'Intake opened.':'Intake closed.');return;}if(event.target.closest?.('[data-main-toggle]')){this.mainOpen=!this.mainOpen;this.refresh(this.mainOpen?'Main valve opened.':'Main valve closed.');return;}if(event.target.closest?.('[data-clear-blockage]')){this.state={...this.state,blockageCleared:true};this.refresh();return;}if(event.target.closest?.('[data-waterworks-reset]')){this.state=resetWaterworksPressure(config);this.intakeOpen=false;this.mainOpen=false;this.refresh('Test reset.');return;}if(event.target.closest?.('[data-waterworks-check]')){this.refresh((evaluateWaterworksPressure(config,this.state).success && (config.variant === 'boiler' || (this.intakeOpen && this.mainOpen)))?'Pressure stabilized!':'The mechanism is not ready.');}});}
    refresh(message=''){const section=rootFor(this)?.querySelector('.rw-waterworks');if(section)section.outerHTML=renderPanel(config,this.state,message);}
  }
  const dialog=new WaterworksDialog();await dialog.render({force:true});return dialog;
}

﻿
/**
 * Campaign Boiler panel. Uses the existing waterworks art + CSS and exact 2/1 preset.
 * All dial movements and solve results come exclusively from the elected-GM Region session.
 * Never locally mutates the authoritative state or advertises the standalone 2/4 demo as canon.
 */
export async function openCavBoilerCampaignPuzzle({region,readState,onAction}={}){
 if(!region||typeof readState!=="function"||typeof onAction!=="function")throw Error("Campaign boiler Region and GM request callback required");
 const DialogV2=globalThis.foundry?.applications?.api?.DialogV2;
 if(!DialogV2)throw Error("Foundry DialogV2 missing");
 const config=createCavBoilerConfig();
 const current=()=>{const s=readState();if(s?.status==="reserved")return{...resetCavBoiler(config),positions:s.positions??{left:0,right:0}};
  if(s?.positions&&["left","right"].every(k=>Number.isInteger(s.positions[k])&&s.positions[k]>=0&&s.positions[k]<=5))
   return{positions:{left:s.positions.left,right:s.positions.right},blockageCleared:false};
  return resetCavBoiler(config);};
 class CampaignBoilerDialog extends DialogV2{
  constructor(){super({classes:["regionwright","rw-waterworks-dialog"],window:{title:"Bathhouse Boiler Pressure",resizable:true},
   position:{width:750,height:530},content:renderPanel(config,current(),"Two pressure valves await your adjustment."),
   buttons:[{action:"close",label:"Close"}]});this.hookId=null;this.sending=false;}
  _onRender(context,options){super._onRender(context,options);const node=rootFor(this);
   if(!this.hookId)this.hookId=Hooks.on("updateRegion",document=>{
    if(document.id===region.id&&document.parent?.id==="CAVBATHScene0001")this.refresh("Boiler controls updated.");
   });
   if(node&&!node.dataset.cavBoilerBound){node.dataset.cavBoilerBound="true";node.addEventListener("click",async event=>{
    const valve=event.target.closest?.("[data-valve]");
    const reset=event.target.closest?.("[data-waterworks-reset]");
    const submit=event.target.closest?.("[data-waterworks-check]");
    if(!valve&&!reset&&!submit||this.sending)return;
    const original=readState()??{revision:0,status:"unsolved"};
    if(original.status==="done"){this.refresh("The boiler is already balanced.");return}
    if(original.status==="reserved"){this.refresh("The Gamemaster is reconciling a prior adjustment.");return}
    if(!Number.isInteger(original.revision)){this.refresh("The dial history needs Gamemaster inspection.");return}
    const req=valve?{op:"adjust",valve:valve.dataset.valve,direction:Number(valve.dataset.step)}:
     reset?{op:"reset"}:{op:"submit"};
    this.sending=true;
    try{await onAction({...req,expectedRevision:original.revision});
     this.refresh("Request sent to the Gamemaster. The displayed dials change only after validation.");
    }catch(e){console.error("[CAV Boiler UI] Failed to send request",e);this.refresh("Request could not be sent. Ask the Gamemaster.");}
    finally{this.sending=false}
   })}}
  _onClose(options){if(this.hookId){Hooks.off("updateRegion",this.hookId);this.hookId=null}return super._onClose(options)}
  refresh(message=""){const target=rootFor(this)?.querySelector(".rw-waterworks");
   if(target)target.outerHTML=renderPanel(config,current(),message);}
 }
 const app=new CampaignBoilerDialog();await app.render({force:true});return app;
}
