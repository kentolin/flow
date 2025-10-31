import { state } from './state.js';
export function exportJSON(){
  const json=JSON.stringify(state,null,2);
  const blob=new Blob([json],{type:'application/json'});
  const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='flowchart.json'; a.click();
}
