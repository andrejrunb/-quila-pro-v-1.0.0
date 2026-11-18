// url=https://www.figma.com/design/aquila-pro-ds/EagleDesignSystem?node-id=101:1005
// source=src/ui/components/Sidebar.tsx
// component=Sidebar
import figma from 'figma'

const instance = figma.selectedInstance

const currentHub = instance.getEnum('Hub', {
  'Administrativo': 'admin',
  'Pedagogico': 'pedagogical',
  'Seguranca': 'security',
})
const isCollapsed = instance.getBoolean('Collapsed')

export default {
  example: figma.code`
    <Sidebar
      currentPage="dashboard"
      currentHub="${currentHub}"
      ${isCollapsed ? 'isCollapsed' : ''}
      onNavigate={(page) => console.log(page)}
      onHubChange={(hub) => console.log(hub)}
      user={{ name: 'Coordenador Escolar', role: 'coordenador' }}
      onLogout={() => console.log('logout')}
    />
  `,
  imports: ['import { Sidebar } from "@/components/Sidebar"'],
  id: 'eagle-sidebar',
  metadata: { nestable: false }
}
