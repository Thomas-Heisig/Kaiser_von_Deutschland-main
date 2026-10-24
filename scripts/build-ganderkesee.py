#!/usr/bin/env python3
"""Build the georeferenced Ganderkesee map from public official terrain/water data.

Offline build only: pip install pillow numpy pyproj matplotlib
python scripts/build-ganderkesee.py [--refresh]
Caches source responses in .temp; records exact requests and SHA-256 hashes.
No network map service is contacted by the game.
"""
import argparse, hashlib, io, json, urllib.parse, urllib.request
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from pyproj import Transformer
import matplotlib
matplotlib.use('Agg')
from matplotlib import pyplot as plt

ROOT=Path(__file__).resolve().parents[1]
CACHE=ROOT/'.temp'; OUT=ROOT/'public/maps'
BOUNDS=[457000,5870000,477000,5884000]
W,H=1200,840
NAMES=['Welse','Dummbäke','Brookbäke','Kimmer Bäke','Immer Bäke','Delme','Hahlbäke','Schierbroker Bäke']
DEM='https://opendata.geoservices.lgln.niedersachsen.de/dgm_wcs?'+urllib.parse.urlencode(dict(
    service='WCS',version='1.0.0',request='GetCoverage',coverage='ni_dgm1',crs='EPSG:25832',
    bbox=','.join(map(str,BOUNDS)),width=W,height=H,format='GEOTIFF_FLOAT32',interpolation='bilinear'))
HYDRO='https://www.umweltkarten-niedersachsen.de/arcgis/rest/services/Hydro_wms/MapServer/20/query?'+urllib.parse.urlencode(dict(
    f='json',where='nam IN ('+','.join("'"+n+"'" for n in NAMES)+')',geometry=','.join(map(str,BOUNDS)),
    geometryType='esriGeometryEnvelope',inSR=25832,outSR=25832,spatialRel='esriSpatialRelIntersects',
    outFields='objectid,nam,gwz,gkz',returnGeometry='true',maxAllowableOffset=8,resultRecordCount=2000))

def source(name,url,refresh):
    target=CACHE/name
    if refresh or not target.exists():
        with urllib.request.urlopen(url,timeout=60) as response: target.write_bytes(response.read())
    return target.read_bytes()

def point(e,n): return [round((e-BOUNDS[0])/20000*960,2),round((BOUNDS[3]-n)/14000*672,2)]

def run(refresh):
    CACHE.mkdir(exist_ok=True); OUT.mkdir(exist_ok=True)
    dem_blob=source('ganderkesee-dem.tif',DEM,refresh)
    water_blob=source('ganderkesee-hydro.json',HYDRO,refresh)
    hydro=json.loads(water_blob)
    if hydro.get('error') or hydro.get('exceededTransferLimit'): raise ValueError('Incomplete hydrography response')
    dem=np.asarray(Image.open(io.BytesIO(dem_blob)),dtype=np.float32)
    if dem.shape!=(H,W) or not np.isfinite(dem).all() or dem.min() < -10 or dem.max()>100:
        raise ValueError('Unexpected elevation coverage')
    # Tint encodes height, not a claim about historical vegetation or land use.
    anchors=np.array([0,8,16,24,32,45])
    colors=np.array([[112,151,135],[139,167,140],[173,187,149],[194,193,152],[208,194,151],[218,198,158]])
    rgb=np.stack([np.interp(dem,anchors,colors[:,i]) for i in range(3)],axis=-1)
    dy,dx=np.gradient(dem,14000/H,20000/W)
    shade=np.clip(.97 + (dx-dy)*2.5,.72,1.12)
    raster=Image.fromarray(np.uint8(np.clip(rgb*shade[:,:,None],0,255)))
    # Generalized 5m contours from this same height grid, never hand-drawn hills.
    smooth=np.asarray(Image.fromarray(np.uint8(np.clip(dem,0,60)*4)).filter(ImageFilter.GaussianBlur(2)))/4
    contours=plt.contour(smooth,levels=np.arange(5,46,5))
    lines=Image.new('RGBA',(W,H)); draw=ImageDraw.Draw(lines)
    for segments in contours.allsegs:
        for seg in segments:
            if len(seg)>4: draw.line([tuple(p) for p in seg],fill=(91,105,77,52),width=1)
    plt.close()
    raster=raster.convert('RGBA'); raster.alpha_composite(lines)
    raster.convert('RGB').save(OUT/'ganderkesee-terrain.webp',quality=92)
    rivers=[]
    for feature in hydro['features']:
        for path in feature.get('geometry',{}).get('paths',[]):
            rivers.append({'id':feature['attributes']['objectid'],'name':feature['attributes']['nam'],
                           'points':[point(*p[:2]) for p in path]})
    transform=Transformer.from_crs(4326,25832,always_xy=True)
    def geo(lon,lat): return point(*transform.transform(lon,lat))
    # Coordinates: official Megalithkultur route guide, tourism POI III, church coordinate from the Wikipedia location infobox (rounded).
    places={
        'home':geo(8.5465,53.0327),
        'steinkimmen-ii':geo(8.4510,53.0455),
        'steinkimmen-i':geo(8.4532,53.0467),
        'steinkimmen-iii':geo(8.450868129730225,53.040913086359495),
        'stenum':geo(8.554973,53.0749),
    }
    metadata={'version':1,'crs':'EPSG:25832','bounds':BOUNDS,'width':960,'height':672,
              'cellSizeMetres':20000/W,'elevationMin':round(float(dem.min()),1),'elevationMax':round(float(dem.max()),1),
              'rivers':rivers,'places':places}
    (OUT/'ganderkesee-map.json').write_text(json.dumps(metadata,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf8')
    provenance={'retrieved':'2026-10-24','terrain':{'request':DEM,'sha256':hashlib.sha256(dem_blob).hexdigest(),
                'attribution':'© GeoBasis-DE/LGLN 2026, Daten geändert','license':'CC-BY-4.0',
                'licenseUrl':'https://creativecommons.org/licenses/by/4.0/',
                'metadata':'https://opendata.geoservices.lgln.niedersachsen.de/dgm_wcs?request=GetMetadata&layer=ni_dgm1'},
                'water':{'request':HYDRO,'sha256':hashlib.sha256(water_blob).hexdigest(),
                'attribution':'Geodaten LGLN © 2023, bearbeitet durch das Nds. Umweltministerium; Auswahl/Zuschnitt für das Spiel',
                'license':'dl-de/by-2-0','licenseUrl':'https://www.govdata.de/dl-de/by-2-0',
                'metadata':'https://www.umweltkarten-niedersachsen.de/arcgis/rest/services/Hydro_wms/MapServer/20?f=pjson'},
                'processing':'DGM1 bilinear auf 16,67m; Höhentönung, Schummerung, geglättete 5m-Höhenlinien. Gewässerachsen mit 8m Vereinfachung, im Renderer zugeschnitten.',
                'historicalLimit':'Heutige Vermessung. Keine Rekonstruktion historischer Bachbetten, Waldflächen, Straßen oder Siedlungsgrenzen.'}
    (OUT/'ganderkesee-source.json').write_text(json.dumps(provenance,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
    print(f'{len(rivers)} river segments; places: {places}; terrain {dem.min():.1f}–{dem.max():.1f}m')

if __name__=='__main__':
    parser=argparse.ArgumentParser();parser.add_argument('--refresh',action='store_true');run(parser.parse_args().refresh)
