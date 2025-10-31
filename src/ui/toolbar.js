import { nodeManager } from '../core/nodeManager.js';
import { exportJSON } from '../core/exporter.js';
import { history } from '../core/history.js';

export function initToolbar(){
  const toolbar=document.getElementById('toolbar');
  const undo=document.createElement('button'); undo.id='undoBtn'; undo.textContent='Undo'; toolbar.appendChild(undo);
  const redo=document.createElement('button'); redo.id='redoBtn'; redo.textContent='Redo'; toolbar.appendChild(redo);
  undo.addEventListener('click',()=>history.undo()); redo.addEventListener('click',()=>history.redo());

  toolbar.addEventListener('click',e=>{
    const type=e.target.dataset.type;
    if(type){ nodeManager.createNode(type,100,100); }
    else if(e.target.id==='exportBtn'){ exportJSON(); }
  });
}
