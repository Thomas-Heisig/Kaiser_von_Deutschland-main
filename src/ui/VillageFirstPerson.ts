import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
import { VILLAGE_FEATURES, VILLAGE_ROADS, WALKABLE_EXTENT, roadWidth, type VillageBuilding } from './SettlementWorld';

/** Same metre-sized footprints as Pixi, with +Z north converted to Three's -Z. */
export function buildVillageExterior(buildings: readonly VillageBuilding[]): Group {
  const group = new Group(); group.name = 'village-exterior';
  const ground = new Mesh(new BoxGeometry(WALKABLE_EXTENT * 2, .04, WALKABLE_EXTENT * 2),
    new MeshStandardMaterial({ color: 0x83977a, roughness: 1 }));
  ground.position.y = -.04; group.add(ground);
  const roadVertices: number[] = [];
  const roads = [...VILLAGE_ROADS.map(r => ({points:r.points,width:roadWidth(r.category)})),
    ...buildings.flatMap(b => [{points:b.route.slice(0,2),width:1.2}, {points:b.route.slice(-2),width:1.2}])];
  for (const road of roads) {
    for (let i=1; i<road.points.length; i++) {
      const a=road.points[i-1], b=road.points[i];
      if (Math.abs(a[0]) > WALKABLE_EXTENT || Math.abs(a[1]) > WALKABLE_EXTENT
        || Math.abs(b[0]) > WALKABLE_EXTENT || Math.abs(b[1]) > WALKABLE_EXTENT) continue;
      const dx=b[0]-a[0], dz=b[1]-a[1], length=Math.hypot(dx,dz);
      if (!length) continue;
      const nx=-dz/length*road.width/2,nz=dx/length*road.width/2;
      const corners=[[a[0]+nx,a[1]+nz],[a[0]-nx,a[1]-nz],[b[0]-nx,b[1]-nz],[b[0]+nx,b[1]+nz]];
      for (const index of [0,1,2,0,2,3]) roadVertices.push(corners[index][0],.002,-corners[index][1]);
    }
  }
  const roadsGeometry = new BufferGeometry();
  roadsGeometry.setAttribute('position',new Float32BufferAttribute(roadVertices,3));
  roadsGeometry.computeVertexNormals();
  group.add(new Mesh(roadsGeometry,new MeshStandardMaterial({color:0xbba982,roughness:1})));
  for (const tree of VILLAGE_FEATURES.filter(f=>f.kind==='tree')) {
    const [x,z]=tree.points[0];
    const crown=new Mesh(new SphereGeometry(2,8,6),new MeshStandardMaterial({color:0x557345,roughness:1}));
    crown.position.set(x,3,-z);group.add(crown);
    const trunk=new Mesh(new BoxGeometry(.35,3,.35),new MeshStandardMaterial({color:0x72563c,roughness:1}));
    trunk.position.set(x,1.5,-z);group.add(trunk);
  }
  for (const b of buildings) {
    const wall = new Mesh(new BoxGeometry(b.width,b.height,b.depth),
      new MeshStandardMaterial({ color: 0xc3aa7e, roughness: .95 }));
    wall.name = b.type; wall.position.set(b.x,b.height/2,-b.z); group.add(wall);
    // Two pitched planes: ridge, eaves and footprint remain tied to world metres.
    const rise = Math.min(2.5,b.width/3), slope = Math.hypot(b.width/2,rise);
    for (const sign of [-1,1]) {
      const roof = new Mesh(new BoxGeometry(slope,.12,b.depth),
        new MeshStandardMaterial({ color: 0x886044, roughness: 1 }));
      roof.position.set(b.x+sign*b.width/4,b.height+rise/2,-b.z);
      roof.rotation.z = -sign*Math.atan2(rise,b.width/2); group.add(roof);
    }
  }
  return group;
}

export function disposeVillageExterior(group: Group): void {
  group.removeFromParent();
  group.traverse(object => {
    if (object instanceof Mesh) {
      object.geometry.dispose();
      for (const material of Array.isArray(object.material) ? object.material : [object.material]) material.dispose();
    }
  });
}
