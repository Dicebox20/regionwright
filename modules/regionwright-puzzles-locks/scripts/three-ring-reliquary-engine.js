// Three-ring symbolic lock; not the torque-based Rotation Lock.
export const THREE_RING_VERSION=1;
export const RING_IDS=Object.freeze(['outer','middle','inner']);
const validCount=n=>Number.isInteger(n)&&n>=3&&n<=12;
const index=(n,len)=>((n%len)+len)%len;
export function createThreeRingConfig({symbols=['moth','rose','key','moon','sun','thorn'],solution=[0,0,0]}={}) {
 if(!Array.isArray(symbols)||!validCount(symbols.length)||symbols.some(s=>typeof s!=='string'||!/^[a-z][a-z0-9-]{0,31}$/.test(s))||new Set(symbols).size!==symbols.length)throw Error('Invalid unique ring symbols');
 if(!Array.isArray(solution)||solution.length!==3||solution.some(n=>!Number.isInteger(n)||n<0||n>=symbols.length))throw Error('Invalid ring solution');
 return Object.freeze({version:THREE_RING_VERSION,symbols:Object.freeze([...symbols]),solution:Object.freeze([...solution])});
}
export function resetThreeRing(config){validateThreeRing(config);return Object.freeze({positions:Object.freeze([0,0,0]),submitted:false});}
export function validateThreeRing(config){if(config?.version!==THREE_RING_VERSION)return createThreeRingConfig({symbols:config?.symbols,solution:config?.solution});return createThreeRingConfig({symbols:config.symbols,solution:config.solution});}
export function rotateThreeRing(config,state,ring,direction=1){const c=validateThreeRing(config);const i=RING_IDS.indexOf(ring);if(i<0||![-1,1].includes(direction))throw Error('Invalid ring action');const p=state?.positions;if(!Array.isArray(p)||p.length!==3||p.some(n=>!Number.isInteger(n)||n<0||n>=c.symbols.length))throw Error('Invalid ring state');const next=[...p];next[i]=index(next[i]+direction,c.symbols.length);return Object.freeze({positions:Object.freeze(next),submitted:false});}
export function evaluateThreeRing(config,state){const c=validateThreeRing(config);const p=state?.positions;const valid=Array.isArray(p)&&p.length===3&&p.every(n=>Number.isInteger(n)&&n>=0&&n<c.symbols.length);return Object.freeze({valid,success:valid&&p.every((n,i)=>n===c.solution[i]),display:Object.freeze(valid?p.map(n=>c.symbols[n]):[])});}
