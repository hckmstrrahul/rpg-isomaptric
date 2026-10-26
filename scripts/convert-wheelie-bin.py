"""Run with Blender 5.x: blender -b --python scripts/convert-wheelie-bin.py."""
import bpy,json,math,tempfile
from pathlib import Path
from mathutils import Vector
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'public/assets/nvidia'
CACHE=Path('/tmp/rpg-nvidia-source')
if not CACHE.exists():CACHE=Path(tempfile.gettempdir())/'rpg-nvidia-source'
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.wm.usd_import(filepath=str(CACHE/'trashCan_wheeled_green_a01/simready_usd/sm_trashCan_wheeled_green_a01_01.usd'),import_materials=False)
def linear(x):return x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4
def material(name,color,roughness):
 m=bpy.data.materials.new(name);m.use_nodes=True
 c=tuple(linear(int(color[i:i+2],16)/255) for i in (0,2,4))+(1,)
 m.diffuse_color=c;p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Base Color'].default_value=c;p.inputs['Roughness'].default_value=roughness
 return m
green=material('Sage green recycled plastic','536e4f',.84);dark=material('Charcoal lid and wheels','303a35',.86)
bpy.context.view_layer.update()
meshes=[o for o in bpy.data.objects if o.type=='MESH']
original=0
for o in meshes:
 bpy.ops.object.select_all(action='DESELECT');bpy.context.view_layer.objects.active=o;o.select_set(True)
 # USD stores each part in an instance collection; use its placement transform.
 instance=bpy.data.objects.get(o.name.replace('_mesh_00','_obj_00'))
 matrix=(instance.matrix_world@o.matrix_world) if instance else o.matrix_world.copy()
 o.parent=None;o.matrix_world=matrix;bpy.context.view_layer.update()
 bpy.ops.object.transform_apply(location=False,rotation=True,scale=True)
 o.data.calc_loop_triangles();count=len(o.data.loop_triangles);original+=count
 target=2400 if 'base' in o.name else 700 if 'lid' in o.name else 350
 o.data.materials.clear();o.data.materials.append(green if 'base' in o.name else dark)
 for face in o.data.polygons:face.material_index=0
 dec=o.modifiers.new('Web silhouette simplification','DECIMATE');dec.ratio=min(1,target/count)
 bpy.ops.object.modifier_apply(modifier=dec.name);o.select_set(False)
# Bake the evaluated pieces into a single mesh; do not depend on USD hierarchy selection.
verts=[];faces=[];slots=[]
for o in meshes:
 offset=len(verts);verts.extend(o.matrix_world@v.co for v in o.data.vertices)
 for face in o.data.polygons:
  faces.append(tuple(offset+i for i in face.vertices));slots.append(0 if 'base' in o.name else 1)
low=Vector(tuple(min(v[i] for v in verts) for i in range(3)));high=Vector(tuple(max(v[i] for v in verts) for i in range(3)))
center=Vector(((low.x+high.x)/2,(low.y+high.y)/2,low.z));factor=1.15/(high.z-low.z)
mesh=bpy.data.meshes.new('Simplified wheelie bin');mesh.from_pydata([(v-center)*factor for v in verts],[],faces);mesh.update()
mesh.materials.append(green);mesh.materials.append(dark)
for p,slot in zip(mesh.polygons,slots):p.material_index=slot;p.use_smooth=False
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
obj=bpy.data.objects.new('NVIDIA wheelie bin · simplified',mesh);bpy.context.collection.objects.link(obj)
bpy.context.view_layer.objects.active=obj;obj.select_set(True)
mesh.calc_loop_triangles();triangles=len(mesh.loop_triangles)
bpy.ops.export_scene.gltf(filepath=str(OUT/'wheelie-bin.glb'),export_format='GLB',use_selection=True,export_animations=False,export_cameras=False,export_lights=False,export_texcoords=False,export_normals=True,export_extras=False)
(OUT/'bin-stats.json').write_text(json.dumps({'sourceTriangles':original,'triangles':triangles,'height':1.15,'materials':2,'bytes':(OUT/'wheelie-bin.glb').stat().st_size},indent=2)+'\n')
print('BIN',original,'->',triangles,'triangles;', (OUT/'wheelie-bin.glb').stat().st_size,'bytes')
# A local asset-only render allows silhouette inspection without relying on browser access.
world=bpy.context.scene.world or bpy.data.worlds.new('World');bpy.context.scene.world=world;world.color=(.4,.4,.4)
bpy.ops.object.camera_add(location=(2.1,-3,2.1));camera=bpy.context.object;direction=Vector((0,0,.6))-camera.location;camera.rotation_euler=direction.to_track_quat('-Z','Y').to_euler();camera.data.type='ORTHO';camera.data.ortho_scale=1.85;bpy.context.scene.camera=camera
bpy.ops.object.light_add(type='AREA',location=(1,-2,4));bpy.context.object.data.energy=220;bpy.context.object.data.shape='DISK';bpy.context.object.data.size=3
scene=bpy.context.scene;scene.render.engine='CYCLES';scene.cycles.samples=24;scene.render.resolution_x=512;scene.render.resolution_y=512;scene.render.resolution_percentage=100;scene.render.image_settings.file_format='PNG';scene.render.filepath='/tmp/rpg-wheelie-preview.png';scene.render.film_transparent=True
bpy.ops.render.render(write_still=True)
