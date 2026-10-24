#!/usr/bin/env python3
"""Render 24 textured Kenney GLB compositions into six offline Pixi atlases.

pip install trimesh vtk pillow numpy
python scripts/render_kenney_districts.py --fantasy PATH.zip --urban PATH.zip
No model, Python runtime or GPU renderer is shipped to the browser.
"""
import argparse, hashlib, io, json, math, zipfile
from pathlib import Path
import numpy as np
import trimesh
import vtk
from vtk.util.numpy_support import numpy_to_vtk, numpy_to_vtkIdTypeArray, vtk_to_numpy
from PIL import Image

ORDER = ['workshops','taverns','warehouses','markets','guildhalls','schools','hospitals','universities',
         'churches','castles','barracks','walls','mines','ports','farms','roads',
         'urban-workshops','urban-warehouses','urban-markets','urban-guildhalls','urban-schools',
         'urban-universities','urban-hospitals','urban-taverns']

def part(name, x=0, y=0, z=0, angle=0): return (name, (x,y,z), angle)

def house(x=0,z=0,paint=False):
    wall = 'wall-pane-painted-wood' if paint else 'wall-pane-wood'
    return [part(wall+'-door',x,0,z+.5),part(wall+'-window',x,0,z-.5,180),
            part(wall,x+.5,0,z,90),part(wall,x-.5,0,z,-90),part('roof',x,1,z)]

def composition(key):
    if key.startswith('urban-'):
        index=ORDER.index(key)-16
        wall='wall-a' if index%2==0 else 'wall-b'
        levels=2 if key in ['urban-universities','urban-hospitals','urban-guildhalls'] else 1
        p=[]
        for level in range(levels):
            p.extend([part(wall+'-door' if level==0 else wall+'-window',0,level,0.5),
                      part(wall+'-window',.5,level,0,90),part(wall,-.5,level,0,-90),
                      part(wall,0,level,-.5,180)])
        p += [part('roof-metal-type-a',0,levels,0),part('detail-bench',.9,0,.7)]
        if key in ['urban-workshops','urban-warehouses']: p += [part('pallet',-.8,0,.8)]
        if key in ['urban-markets','urban-taverns']: p += [part('detail-awning-wide',0,.7,.55)]
        return p
    if key=='walls': return [part('wall-fortified-gate'),part('tower-base',-1),part('tower',-1,1),part('tower-top',-1,2),part('tower-base',1),part('tower-top',1,1)]
    if key=='ports': return [part('dock-side',-.5),part('dock-side',.5),part('dock-corner',0,0,1),part('detail-barrel',-.6,.1,.6),part('detail-crate',.6,.1,.6)]
    if key=='roads': return [part('floor-flat',-.8),part('floor-flat'),part('floor-flat',.8),part('column-damaged',.8,0,-.6)]
    if key=='farms': return house()+[part('fence-wood',1,0,.5,90),part('fence-wood',1,0,-.5,90),part('detail-barrel',-.8,0,.5)]
    if key=='mines': return [part('wall-gate'),part('bricks',-.8),part('bricks',.8),part('pulley-crate',0,.7,0),part('detail-crate',.8,0,.8)]
    if key=='castles': return [part('wall-fortified-gate'),part('tower-base',-1),part('tower',-1,1),part('tower-top',-1,2),part('tower-base',1),part('tower',1,1),part('tower-top',1,2)]+house(0,-.7,True)
    p=house(paint=key in ['guildhalls','schools','hospitals','universities','churches'])
    extras={
        'workshops':[part('pulley',-.7,0,.7),part('bricks',.8,0,.5)],
        'taverns':[part('barrels',.8,0,.5),part('overhang',0,.8,.6)],
        'warehouses':[part('detail-crate',.8,0,.5),part('detail-crate-ropes',-.8,0,.7)],
        'markets':[part('overhang',0,.8,.7),part('detail-crate',-.8,0,.7),part('barrels',.9,0,.7)],
        'guildhalls':[part('column-paint',-.7,0,.7),part('column-paint',.7,0,.7)],
        'schools':[part('tree-shrub',.9,0,0),part('detail-crate-small',-.7,0,.7)],
        'hospitals':[part('overhang-round',0,.8,.6),part('tree-shrub',1,0,0)],
        'universities':[part('tower-paint-base',1),part('tower-paint',1,1),part('tower-top',1,2)],
        'churches':[part('tower-base',0,0,-.8),part('tower',0,1,-.8),part('tower-top',0,2,-.8)],
        'barracks':[part('fence',1,0,0,90),part('detail-crate',-.8,0,.7),part('structure-poles',.8,0,.6)]}
    return p+extras.get(key,[])

def add_model(renderer, archive, name, pos, angle):
    path='Models/GLB format/'+name+'.glb'
    blob=archive.read(path)
    # Kenney GLBs reference external PNGs beside the GLB, not embedded images.
    resolver={p.removeprefix('Models/GLB format/'):archive.read(p)
              for p in archive.namelist() if p.startswith('Models/GLB format/Textures/') and p.endswith('.png')}
    model=trimesh.load(io.BytesIO(blob),file_type='glb',force='scene',resolver=resolver)
    for node in sorted(model.graph.nodes_geometry):
        matrix,geom=model.graph[node]
        mesh=model.geometry[geom].copy()
        mesh.apply_transform(matrix)
        mesh.apply_transform(trimesh.transformations.rotation_matrix(math.radians(angle),[0,1,0]))
        mesh.apply_translation(pos)
        points=vtk.vtkPoints(); points.SetData(numpy_to_vtk(np.asarray(mesh.vertices,dtype=np.float32),deep=True))
        faces=np.column_stack([np.full(len(mesh.faces),3,dtype=np.int64),mesh.faces.astype(np.int64)])
        cells=vtk.vtkCellArray(); cells.SetCells(len(faces),numpy_to_vtkIdTypeArray(faces.ravel(),deep=True))
        poly=vtk.vtkPolyData(); poly.SetPoints(points); poly.SetPolys(cells)
        mapper=vtk.vtkPolyDataMapper(); mapper.SetInputData(poly)
        actor=vtk.vtkActor(); actor.SetMapper(mapper)
        material=getattr(mesh.visual,'material',None)
        texture=getattr(material,'baseColorTexture',None)
        uv=getattr(mesh.visual,'uv',None)
        if texture is not None and uv is not None:
            poly.GetPointData().SetTCoords(numpy_to_vtk(np.asarray(uv,dtype=np.float32),deep=True))
            pixels=np.flipud(np.asarray(texture.convert('RGBA'))).copy()
            data=vtk.vtkImageData(); data.SetDimensions(pixels.shape[1],pixels.shape[0],1)
            data.GetPointData().SetScalars(numpy_to_vtk(pixels.reshape(-1,4),deep=True,array_type=vtk.VTK_UNSIGNED_CHAR))
            tex=vtk.vtkTexture(); tex.SetInputData(data); tex.InterpolateOff(); tex.RepeatOn(); actor.SetTexture(tex)
        else:
            factor=getattr(material,'baseColorFactor',None)
            actor.GetProperty().SetColor(*(np.asarray(factor[:3])/255 if factor is not None else [.65,.55,.40]))
        actor.GetProperty().SetAmbient(.48); actor.GetProperty().SetDiffuse(.52)
        renderer.AddActor(actor)
    return {'file':path,'sha256':hashlib.sha256(blob).hexdigest(),'position':pos,'rotation':angle}

def render(archive,parts):
    renderer=vtk.vtkRenderer(); renderer.SetBackground(0,0,0); renderer.SetBackgroundAlpha(0)
    provenance=[add_model(renderer,archive,*p) for p in parts]
    bounds=renderer.ComputeVisiblePropBounds()
    center=[(bounds[i]+bounds[i+1])/2 for i in [0,2,4]]
    camera=vtk.vtkCamera(); camera.ParallelProjectionOn(); camera.SetViewUp(0,1,0)
    camera.SetFocalPoint(*center); camera.SetPosition(center[0]+7,center[1]+6,center[2]+7)
    renderer.SetActiveCamera(camera); renderer.ResetCamera(); camera.SetParallelScale(camera.GetParallelScale()*1.08)
    window=vtk.vtkRenderWindow(); window.SetOffScreenRendering(1); window.SetAlphaBitPlanes(1)
    window.SetMultiSamples(4); window.SetSize(384,384); window.AddRenderer(renderer); window.Render()
    grab=vtk.vtkWindowToImageFilter(); grab.SetInput(window); grab.SetInputBufferTypeToRGBA(); grab.ReadFrontBufferOff(); grab.Update()
    pixels=vtk_to_numpy(grab.GetOutput().GetPointData().GetScalars()).reshape(384,384,4)
    image=Image.fromarray(np.flipud(pixels).copy()).resize((192,192),Image.Resampling.LANCZOS)
    window.Finalize()
    if not image.getchannel('A').getbbox(): raise RuntimeError('Empty render')
    return image,provenance

if __name__=='__main__':
    parser=argparse.ArgumentParser(); parser.add_argument('--fantasy',type=Path,required=True); parser.add_argument('--urban',type=Path,required=True)
    parser.add_argument('--output',type=Path,default=Path('public/assets/kenney/buildings')); args=parser.parse_args()
    args.output.mkdir(parents=True,exist_ok=True)
    metadata={'license':'CC0-1.0','authors':['Kenney'], 'sources':['https://kenney.nl/assets/retro-fantasy-kit','https://kenney.nl/assets/retro-urban-kit'],
              'renderer':'VTK offscreen, orthographic; original GLB UV textures via trimesh', 'frames':[],
              'sourceArchives':{p.name:hashlib.sha256(p.read_bytes()).hexdigest() for p in [args.fantasy,args.urban]}}
    with zipfile.ZipFile(args.fantasy) as fantasy, zipfile.ZipFile(args.urban) as urban:
        for page in range(6):
            atlas=Image.new('RGBA',(384,384))
            for local in range(4):
                key=ORDER[page*4+local]
                frame,parts=render(urban if key.startswith('urban-') else fantasy,composition(key))
                atlas.paste(frame,((local%2)*192,(local//2)*192))
                metadata['frames'].append({'key':key,'page':page,'frame':local,'parts':parts})
                print(key,flush=True)
            atlas.save(args.output/f'districts-v1-{page}.webp',lossless=True)
    (args.output/'provenance.json').write_text(json.dumps(metadata,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
