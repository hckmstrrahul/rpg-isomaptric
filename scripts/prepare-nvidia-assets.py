"""Rebuild the web trial from NVIDIA's CC BY 4.0 SimReady source assets.
Run: uv run --with pillow python scripts/prepare-nvidia-assets.py
Then: blender -b --python scripts/convert-wheelie-bin.py
Raw sources stay in the system temp directory; only optimized derivatives ship.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import hashlib,json,shutil,tempfile,urllib.request
from PIL import Image,ImageEnhance
REVISION='524747d9b5e1f21b5b18b56041788c01d745f1a1'
ROOT=Path(__file__).resolve().parents[1]
CACHE=Path(tempfile.gettempdir())/'rpg-nvidia-source'
# Use the same deterministic cache on macOS and other systems.
if Path('/tmp/rpg-nvidia-source').exists():CACHE=Path('/tmp/rpg-nvidia-source')
OUT=ROOT/'public/assets/nvidia';OUT.mkdir(parents=True,exist_ok=True)
BASE=f'https://huggingface.co/datasets/nvidia/simready-assets/resolve/{REVISION}/'
PACKAGES=['environment_floor_a01','barrier_wall_plastic_orange_a03','trashCan_wheeled_green_a01']
paths=[]
for package in PACKAGES:
 url=f'https://huggingface.co/api/datasets/nvidia/simready-assets/tree/{REVISION}/{package}?recursive=true&limit=1000'
 for entry in json.load(urllib.request.urlopen(url)):
  path=entry['path']
  if entry['type']!='file' or '/.thumbs/' in path:continue
  if path.endswith('LICENSE.txt') or package.startswith('trash') and path.endswith(('.usd','.usda')) or '/Textures/' in path and ('t_concretePlain_d01' in path or 'T_Aluminium_Brushed_A1' in path):paths.append(path)
def download(path):
 dest=CACHE/path;dest.parent.mkdir(parents=True,exist_ok=True)
 if not dest.exists():urllib.request.urlretrieve(BASE+path,dest)
with ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(download,paths))
for name,package,prefix,suffixes,size in [
 ('concrete','environment_floor_a01','t_concretePlain_d01',['alb','nor','orm'],512),
 ('metal','barrier_wall_plastic_orange_a03','T_Aluminium_Brushed_A1',['Albedo','Normal','ORM'],256),
]:
 for kind,suffix in zip(['albedo','normal','orm'],suffixes):
  image=Image.open(CACHE/package/'simready_usd/Textures'/f'{prefix}_{suffix}.png').convert('RGB').resize((size,size),Image.Resampling.LANCZOS)
  if kind=='albedo':
   # Keep the fine source grain; reduce photographic contrast for the miniature city.
   image=ImageEnhance.Contrast(image).enhance(.45 if name=='concrete' else .65)
   image=ImageEnhance.Color(image).enhance(.25)
   image.save(OUT/f'{name}-{kind}.webp',quality=85,method=6)
  else:image.save(OUT/f'{name}-{kind}.png',optimize=True)
shutil.copyfile(CACHE/PACKAGES[0]/'.metadata/LICENSE.txt',OUT/'LICENSE.txt')
manifest={'creator':'NVIDIA','license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','revision':REVISION,'sources':[{'package':p,'url':f'https://huggingface.co/datasets/nvidia/simready-assets/tree/{REVISION}/{p}'} for p in PACKAGES], 'adaptations':['Concrete: 512px maps, reduced albedo contrast and saturation, subtle normal intensity in app.','Brushed aluminium: 256px maps, reduced albedo contrast and saturation, painted tint in app.','Wheelie bin: original USD mesh decimated, flattened hierarchy, simplified green/charcoal materials, normalized to 1.15 world units, exported to GLB without physics or source textures.']}
(OUT/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
print('Prepared textures at',OUT,'; raw source cache:',CACHE)
