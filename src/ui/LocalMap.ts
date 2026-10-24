import { Container, Graphics, Sprite, Text, type Texture } from 'pixi.js';
import { localLandmarks, localPlaceName, LOCAL_MAP_CREDIT } from '../core/StartLocations';

export interface LocalMapData {
  version: number; crs: string; bounds: number[]; width: number; height: number;
  rivers: Array<{id: number; name: string; points: [number,number][]}>;
  places: Record<string,[number,number]>;
}
export function validateLocalMap(value: unknown): LocalMapData {
  const data = value as LocalMapData;
  const coordinate = (p: unknown): p is [number,number] => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite);
  if (!data || data.version !== 1 || data.crs !== 'EPSG:25832' || data.width !== 960 || data.height !== 672 ||
      !Array.isArray(data.rivers) || !data.rivers.length || !coordinate(data.places?.home) ||
      data.rivers.some(r => typeof r.name !== 'string' || !Array.isArray(r.points) || r.points.some(p => !coordinate(p))))
    throw new Error('Unvollständige geografische Kartendaten.');
  return data;
}
export function drawLocalMap(layer: Container, texture: Texture | undefined, data: LocalMapData | undefined,
  year: number, onLandmark?: () => void): number {
  const width=960, height=672;
  const backdrop = new Graphics().rect(0,0,width,height).fill(0x83977a);
  layer.addChild(backdrop);
  if (texture) { const sprite = new Sprite(texture); sprite.width=width; sprite.height=height; layer.addChild(sprite); }
  const text = (value: string,x: number,y: number,size=16,color=0x213a35): Text => {
    const label = new Text({text:value,style:{fontFamily:'Georgia',fontSize:size,fill:color,
      stroke:{color:0xf2ecd5,width:3},fontWeight:'600'}});
    label.position.set(x,y);layer.addChild(label);return label;
  };
  if (!data) { text('Ganderkesee · Kartendaten werden geladen …',140,320,22); return 0; }
  // Uniform projected metre scale: 2 km are 96 map pixels on both axes.
  const grid = new Graphics();
  for(let x=96;x<width;x+=96) grid.moveTo(x,0).lineTo(x,height);
  for(let y=96;y<height;y+=96) grid.moveTo(0,y).lineTo(width,y);
  grid.stroke({color:0x526a53,width:0.6,alpha:0.18});layer.addChild(grid);
  const water = new Container(); const clip = new Graphics().rect(0,0,width,height).fill(0xffffff);
  water.mask=clip; layer.addChild(water,clip);
  const names = new Map<string,{length:number;point:[number,number]}>();
  for(const river of data.rivers) {
    if(river.points.length<2) continue;
    const line=new Graphics();line.moveTo(...river.points[0]);
    for(const p of river.points.slice(1))line.lineTo(...p);
    line.stroke({width:river.name==='Delme'?3.2:2.1,color:0x287b99,alpha:.95});water.addChild(line);
    const inside=river.points.filter(([x,y])=>x>65 && x<width-130 && y>95 && y<height-80);
    const length=inside.reduce((sum,p,i)=>i?sum+Math.hypot(p[0]-inside[i-1][0],p[1]-inside[i-1][1]):0,0);
    if(inside.length && length > (names.get(river.name)?.length??0))names.set(river.name,{length,point:inside[Math.floor(inside.length/2)]});
  }
  const occupied: Array<{x:number;y:number;width:number;height:number}> = [];
  const placeLabel=(label:Text,x:number,y:number) => {
    x=Math.max(12,Math.min(width-label.width-12,x));
    y=Math.max(82,Math.min(height-75-label.height,y));
    while(occupied.some(b=>x<b.x+b.width+8 && x+label.width+8>b.x && y<b.y+b.height+6 && y+label.height+6>b.y)) y+=24;
    label.position.set(x,y);occupied.push({x,y,width:label.width,height:label.height});
  };
  const [homeX,homeY]=data.places.home;
  layer.addChild(new Graphics().circle(homeX,homeY,12).fill(0xf8e1a3).stroke({color:0x715b36,width:3}));
  placeLabel(text(localPlaceName(year),0,0,20),homeX+17,homeY-12);
  text('Dein Startgebiet',homeX+17,homeY+18,12);
  for(const landmark of localLandmarks(year).filter(l=>l.point!=='home')) {
    const p=data.places[landmark.point]; if(!p)continue;
    layer.addChild(new Graphics().poly([p[0],p[1]-7,p[0]+7,p[1],p[0],p[1]+7,p[0]-7,p[1]])
      .fill(0x735941).stroke({color:0xf5e6c5,width:2}));
    const label=text(landmark.mapLabel,0,0,16);
    placeLabel(label,p[0]+12,p[1]-20);
    label.eventMode='static';label.cursor='pointer';label.on('pointertap',()=>onLandmark?.());
  }
  // The church and organ share the home coordinate, so one contextual label avoids overlap.
  const church = localLandmarks(year).find(l=>l.id==='church');
  if(church) placeLabel(text(church.mapLabel,0,0,13),homeX+17,homeY+42);
  for(const [name,{point}] of names)placeLabel(text(name,0,0,14,0x1b607f),point[0]+6,point[1]-15);
  text('GANDERKESEER GEEST',28,22,28);
  text('Gelände zwischen Weser und Hunte · heutige Vermessung',30,57,14);
  text('N\n↑',909,30,22);
  const scale=new Graphics().moveTo(30,615).lineTo(126,615).moveTo(30,609).lineTo(30,621).moveTo(126,609).lineTo(126,621)
    .stroke({color:0x304a3d,width:3});layer.addChild(scale);
  text('0                  2 km',28,625,12);
  text('Höhenlinien: 5 m · Blaue Linien: Gewässerachsen',270,620,12);
  text(LOCAL_MAP_CREDIT,24,651,10);
  layer.addChild(new Graphics().rect(0,0,width,height).stroke({color:0x897650,width:3}));
  return data.rivers.length;
}
