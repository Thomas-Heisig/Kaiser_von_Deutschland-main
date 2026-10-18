#!/usr/bin/env python3
"""One reproducible GLB -> transparent isometric PNG (Kenney Retro Fantasy, CC0).
Usage: pip install numpy trimesh vtk pillow
python scripts/render_kenney_house.py --zip kenney_retro-fantasy-kit.zip
Uses EGL/VTK offscreen; does not alter GameEngine or savegames.
"""
import argparse, hashlib, io, json, math, zipfile
from pathlib import Path
import numpy as np
import trimesh
import vtk
from vtk.util.numpy_support import numpy_to_vtk, numpy_to_vtkIdTypeArray
from PIL import Image

PARTS=(('wall-pane-wood-door',(0,0,.52),0),
       ('wall-pane-wood-window',(0,0,-.52),180),
       ('wall-pane-wood-window',(.52,0,0),90),
       ('wall-pane-wood',(-.52,0,0),-90),
       ('roof',(0,1,0),0))

def digest(data): return hashlib.sha256(data).hexdigest()

def run(source, output):
    scene=vtk.vtkRenderer()
    scene.SetBackground(0,0,0)
    scene.SetBackgroundAlpha(0)
    details=[]
    with zipfile.ZipFile(source) as archive:
        for name,pos,angle in PARTS:
            path=f'Models/GLB format/{name}.glb'
            blob=archive.read(path)
            details.append({'file':path,'sha256':digest(blob)})
            model=trimesh.load(io.BytesIO(blob),file_type='glb',force='scene')
            for index,node in enumerate(sorted(model.graph.nodes_geometry)):
                transform,geom=model.graph[node]
                mesh=model.geometry[geom].copy()
                mesh.apply_transform(transform)
                mesh.apply_transform(trimesh.transformations.rotation_matrix(math.radians(angle),[0,1,0]))
                mesh.apply_translation(pos)
                if len(mesh.faces)==0: continue
                points=vtk.vtkPoints()
                points.SetData(numpy_to_vtk(np.ascontiguousarray(mesh.vertices.astype(np.float32)),deep=True))
                cells=np.ascontiguousarray(np.column_stack(
                    [np.full(len(mesh.faces),3,dtype=np.int64),mesh.faces.astype(np.int64)]))
                poly=vtk.vtkPolyData()
                poly.SetPoints(points)
                triangles=vtk.vtkCellArray()
                triangles.SetCells(len(cells),numpy_to_vtkIdTypeArray(cells.ravel(),deep=True))
                poly.SetPolys(triangles)
                colors=([(138,73,54,255),(177,113,73,255),(116,66,48,255),(110,69,46,255)]
                        if name=='roof' else [(198,171,126,255),(111,73,45,255),(80,53,39,255)])
                rgba=np.tile(np.array(colors[index%len(colors)],dtype=np.uint8),(len(mesh.faces),1))
                scalars=numpy_to_vtk(rgba,deep=True,array_type=vtk.VTK_UNSIGNED_CHAR)
                scalars.SetNumberOfComponents(4)
                poly.GetCellData().SetScalars(scalars)
                mapper=vtk.vtkPolyDataMapper()
                mapper.SetInputData(poly)
                mapper.SetScalarModeToUseCellData()
                mapper.SetColorModeToDirectScalars()
                mapper.ScalarVisibilityOn()
                actor=vtk.vtkActor()
                actor.SetMapper(mapper)
                actor.GetProperty().SetInterpolationToFlat()
                actor.GetProperty().SetAmbient(.47)
                actor.GetProperty().SetDiffuse(.52)
                scene.AddActor(actor)
    cam=vtk.vtkCamera()
    az=math.radians(45); el=math.radians(30)
    cam.SetPosition(7*math.cos(el)*math.sin(az),7*math.sin(el),7*math.cos(el)*math.cos(az))
    cam.SetFocalPoint(0,.82,0)
    cam.SetViewUp(0,1,0)
    cam.ParallelProjectionOn()
    cam.SetParallelScale(1.85)
    scene.SetActiveCamera(cam)
    lamp=vtk.vtkLight()
    lamp.SetLightTypeToSceneLight()
    lamp.SetPosition(-3,7,5)
    lamp.SetFocalPoint(0,0,0)
    lamp.SetIntensity(1)
    scene.AddLight(lamp)
    window=vtk.vtkRenderWindow()
    window.SetOffScreenRendering(1)
    window.SetAlphaBitPlanes(1)
    window.SetMultiSamples(4)
    window.SetSize(384,384)
    window.AddRenderer(scene)
    window.Render()
    filt=vtk.vtkWindowToImageFilter()
    filt.SetInput(window)
    filt.SetInputBufferTypeToRGBA()
    filt.ReadFrontBufferOff()
    filt.Update()
    writer=vtk.vtkPNGWriter()
    writer.SetInputConnection(filt.GetOutputPort())
    writer.SetWriteToMemory(True)
    writer.Write()
    image=Image.open(io.BytesIO(memoryview(writer.GetResult()).tobytes())).convert('RGBA')
    if not image.getchannel('A').getbbox(): raise RuntimeError('Transparent render: no model visible')
    output.parent.mkdir(parents=True,exist_ok=True)
    image.save(output,optimize=True)
    meta={'output':output.name,'sha256':digest(output.read_bytes()),'source_sha256':digest(source.read_bytes()),
          'license':'Kenney CC0','source_parts':details,'camera':'ortho: azimuth 45, elevation 30, scale 1.85',
          'lighting':'scene light (-3,7,5)','renderer':'VTK EGL, GLB geometry via trimesh',
          'colors':'deterministic game palette; GLB material texture is not transferred'}
    output.with_suffix('.json').write_text(json.dumps(meta,indent=2)+'\n',encoding='utf8')
    print(json.dumps(meta,indent=2))

if __name__=='__main__':
    p=argparse.ArgumentParser()
    p.add_argument('--zip',type=Path,required=True)
    p.add_argument('--output',type=Path,default=Path('public/assets/kenney/retro-house-1200.png'))
    args=p.parse_args()
    run(args.zip,args.output)
