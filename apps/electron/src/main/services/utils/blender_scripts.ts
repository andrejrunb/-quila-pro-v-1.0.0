/**
 * Dicionário de templates de scripts Python que serão enviados
 * ao servidor MCP do Blender via socket.
 */

export const BlenderScripts = {
  /**
   * Limpa todas as câmeras e malhas criadas pelo script anterior.
   */
  clearScene: `
import bpy
bpy.ops.object.select_all(action='DESELECT')
for obj in bpy.context.scene.objects:
    if obj.name.startswith("AQUILA_"):
        obj.select_set(True)
bpy.ops.object.delete()
  `,

  /**
   * Gera formas geométricas simulando paredes e corredores.
   * Utilizado quando a escola não possui um .blend nativo.
   */
  generatePlaceholderEnvironment: `
import bpy

# Função auxiliar para criar blocos
def create_block(name, loc, scale):
    bpy.ops.mesh.primitive_cube_add(location=loc)
    obj = bpy.context.active_object
    obj.name = "AQUILA_WALL_" + name
    obj.scale = scale

# Corredor Principal
create_block("C_Left", (-5, 0, 1.5), (0.2, 10, 1.5))
create_block("C_Right", (5, 0, 1.5), (0.2, 10, 1.5))
create_block("C_Back", (0, 10, 1.5), (5, 0.2, 1.5))
  `,

  /**
   * Posiciona uma câmera de vigilância na cena e ajusta
   * o frustum (cone de visão) para simular o campo tático.
   */
  spawnCamera: (id: string, x: number, y: number, z: number, type: string) => `
import bpy
import math

# Criar a câmera principal
bpy.ops.object.camera_add(location=(${x}, ${y}, ${z}))
cam = bpy.context.active_object
cam.name = "AQUILA_CAM_${id}"

# Definir FOV baseado no tipo (PTZ vs Bullet)
cam.data.lens = 15 if "${type}" == "PTZ" else 24

# Apontar para o centro do corredor (Look at origin)
from mathutils import Vector
direction = Vector((0, 0, 0)) - cam.location
rot_quat = direction.to_track_quat('-Z', 'Y')
cam.rotation_euler = rot_quat.to_euler()

# Adicionar cone visual
bpy.ops.mesh.primitive_cone_add(vertices=32, radius1=3, radius2=0, depth=5, location=(${x}, ${y}, ${z}))
cone = bpy.context.active_object
cone.name = "AQUILA_FOV_${id}"
cone.rotation_euler = cam.rotation_euler
cone.location += direction.normalized() * -2.5

# Material translúcido para o FOV
mat = bpy.data.materials.new(name="AQUILA_FOV_MAT")
mat.use_nodes = True
bsdf = mat.node_tree.nodes["Principled BSDF"]
bsdf.inputs["Base Color"].default_value = (0.2, 0.6, 1.0, 1.0)
bsdf.inputs["Alpha"].default_value = 0.3
mat.blend_method = 'BLEND'
cone.data.materials.append(mat)

# Ativar a câmera recém criada na view
bpy.context.scene.camera = cam
  `
};
