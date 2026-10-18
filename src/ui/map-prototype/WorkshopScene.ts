import {Application,Container,Graphics,Text} from 'pixi.js';
import {SZENE,werkstattKacheln} from './WorkshopSceneModel';

/** Isolierter Renderer-Teststand: Platzhalter bis zum geprüften Kenney-Archiv. */
export class WorkshopScene {
 private readonly app=new Application();
 private readonly smoke=new Container();
 private readonly frames:number[]=[];
 private last=0;
 private elapsed=0;
 /** Initialisiert genau eine Szene; erzeugt keinerlei Spielzustand. */
 public async start(host:HTMLElement,report:HTMLElement):Promise<void>{
  await this.app.init({background:0x1e3027,antialias:true,resizeTo:host,
    resolution:Math.min(window.devicePixelRatio||1,2)});
  host.append(this.app.canvas);
  this.app.ticker.maxFPS=SZENE.zielFps;
  const world=new Container();
  world.position.set(host.clientWidth/2,Math.max(90,host.clientHeight/2-195));
  this.app.stage.addChild(world);
  for(const cell of werkstattKacheln()){
   const base=(cell.spalte+cell.zeile)%3===0?0x5b8b57:0x70975d;
   world.addChild(new Graphics().poly([cell.x,cell.y,cell.x+32,cell.y+16,
     cell.x,cell.y+32,cell.x-32,cell.y+16]).fill(base).stroke({color:0x385437,width:1}));
  }
  const building=new Container();
  building.position.set(0,184);
  building.addChild(new Graphics().ellipse(0,32,86,34).fill({color:0x10120d,alpha:0.29}));
  building.addChild(new Graphics().rect(-34,-30,68,65).fill(0xa58a69)
    .poly([-48,-30,0,-64,48,-30,0,-6]).fill(0x774d37)
    .rect(-10,6,19,29).fill(0x553a29).rect(20,-12,11,12).fill(0xe3b76d));
  world.addChild(building);
  // Genau eine vorberechnete Lichtmaske, keine externe Lighting-Abhängigkeit.
  const light=new Graphics().circle(27,181,72).fill({color:0xffc76e,alpha:0.12});
  world.addChild(light);
  world.addChild(this.smoke);
  for(let i=0;i<SZENE.rauch;i++){
   const particle=new Graphics().circle(0,0,2+i%3).fill({color:0xc7c6bc,alpha:0.36});
   this.smoke.addChild(particle);
  }
  const notice=new Text({text:'Vorläufige geometrische Platzhalter · Kenney-Originaldateien noch ungeprüft',
    style:{fontFamily:'Arial',fontSize:12,fill:0xffdb9b}});
  notice.position.set(12,12);this.app.stage.addChild(notice);
  this.app.ticker.add(tick=>{
   const now=performance.now();
   if(this.last && now-this.last<1000) this.frames.push(now-this.last);
   this.last=now;
   if(this.frames.length>9000)this.frames.shift();
   this.elapsed+=Math.min(tick.deltaMS,50)/1000;
   for(let i=0;i<this.smoke.children.length;i++){
    const p=this.smoke.children[i];const t=(this.elapsed*0.24+i/SZENE.rauch)%1;
    p.position.set(14+Math.sin(i*3+t*10)*11,-35-t*105+184);
    p.alpha=0.32*(1-t);
   }
  });
  const publish=():void=>{
   const sorted=[...this.frames].sort((a,b)=>a-b);
   const avg=sorted.reduce((a,b)=>a+b,0)/(sorted.length||1);
   const p95=sorted[Math.min(sorted.length-1,Math.floor(sorted.length*0.95))]??0;
   report.textContent='Frames: '+sorted.length+' · Mittel: '+avg.toFixed(1)+
     ' ms · P95: '+p95.toFixed(1)+' ms · >50 ms: '+
     sorted.filter(x=>x>50).length+' · Gerät: '+navigator.userAgent;
  };
  window.setInterval(publish,2000);
 }
}
