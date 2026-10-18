import {WorkshopScene} from './WorkshopScene';
const host=document.getElementById('scene'),report=document.getElementById('measure');
if(!host||!report) throw new Error('Test-Container fehlen');
const scene=new WorkshopScene();
void scene.start(host,report).catch(error=>{report.textContent='Rendererfehler: '+String(error);});
