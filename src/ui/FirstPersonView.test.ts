import { describe, expect, it } from 'vitest';
import { BoxGeometry, Mesh, Scene } from 'three';
import { FirstPersonView } from './FirstPersonView';
import { DWELLING_FURNITURE, DWELLING_WALLS, DWELLING_WALL_HEIGHT } from './FirstPersonLogic';

// Build actual Three meshes without a DOM or GPU; lifecycle/browser input is tested separately.
describe('Three.js dwelling geometry', () => {
  it('uses shared metric walls, furniture, floor and roof rather than malformed vertex buffers', () => {
    const view = new FirstPersonView();
    const internal = view as unknown as { buildScene(): void; scene: Scene };
    internal.buildScene();
    const meshes = internal.scene.children.filter(
      (object): object is Mesh<BoxGeometry> => object instanceof Mesh && object.geometry instanceof BoxGeometry,
    );
    const boxes = meshes.map(mesh => ({
      x: mesh.position.x, z: mesh.position.z,
      ...mesh.geometry.parameters,
    }));
    expect(boxes.some(box => box.width === 6 && box.depth === 8 && box.height === 0.02)).toBe(true);
    expect(boxes.some(box => box.width === 6 && box.depth === 8 && box.height === 0.15)).toBe(true);
    for (const wall of DWELLING_WALLS) {
      expect(boxes).toContainEqual(expect.objectContaining({
        x: wall.x, z: -wall.z, width: wall.width, depth: wall.depth, height: DWELLING_WALL_HEIGHT,
      }));
    }
    for (const item of Object.values(DWELLING_FURNITURE)) {
      expect(boxes).toContainEqual(expect.objectContaining({
        x: item.x, z: -item.z, width: item.width, depth: item.depth, height: item.height,
      }));
    }
    for (const mesh of meshes) {
      mesh.geometry.dispose();
      if (!Array.isArray(mesh.material)) mesh.material.dispose();
    }
  });
});
