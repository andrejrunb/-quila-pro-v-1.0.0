// url=https://www.figma.com/design/aquila-pro-ds/EagleDesignSystem?node-id=101:1006
// source=src/ui/components/TopBar.tsx
// component=TopBar
import figma from 'figma'

const instance = figma.selectedInstance

export default {
  example: figma.code`
    <TopBar
      user={{ name: 'Professor Regente', role: 'professor' }}
      onNavigate={(page) => console.log(page)}
      onSearch={() => console.log('search')}
    />
  `,
  imports: ['import { TopBar } from "@/components/TopBar"'],
  id: 'eagle-topbar',
  metadata: { nestable: false }
}
