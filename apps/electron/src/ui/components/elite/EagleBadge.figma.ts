// url=https://www.figma.com/design/aquila-pro-ds/EagleDesignSystem?node-id=101:1003
// source=src/ui/components/elite/EagleBadge.tsx
// component=EagleBadge
import figma from 'figma'

const instance = figma.selectedInstance

const label = instance.getString('Label')
const variant = instance.getEnum('Variant', {
  'Success': 'success',
  'Danger': 'danger',
  'Warning': 'warning',
  'Info': 'info',
  'Default': 'default',
})
const glow = instance.getBoolean('Glow')

export default {
  example: figma.code`
    <EagleBadge
      variant="${variant}"
      ${glow ? 'glow' : ''}
    >
      ${label}
    </EagleBadge>
  `,
  imports: ['import { EagleBadge } from "@/components/elite/EagleBadge"'],
  id: 'eagle-badge',
  metadata: { nestable: true }
}
