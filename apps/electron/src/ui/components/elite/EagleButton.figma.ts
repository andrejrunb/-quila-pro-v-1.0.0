// url=https://www.figma.com/design/aquila-pro-ds/EagleDesignSystem?node-id=101:1001
// source=src/ui/components/elite/EagleButton.tsx
// component=EagleButton
import figma from 'figma'

const instance = figma.selectedInstance

const label = instance.getString('Label')
const variant = instance.getEnum('Variant', {
  'Primary': 'primary',
  'Secondary': 'secondary',
  'Danger': 'danger',
  'Ghost': 'ghost',
})
const size = instance.getEnum('Size', {
  'Small': 'sm',
  'Medium': 'md',
  'Large': 'lg',
})
const glow = instance.getBoolean('Glow')
const loading = instance.getBoolean('Loading')
const disabled = instance.getBoolean('Disabled')

export default {
  example: figma.code`
    <EagleButton
      variant="${variant}"
      size="${size}"
      ${glow ? 'glow' : ''}
      ${loading ? 'loading' : ''}
      ${disabled ? 'disabled' : ''}
    >
      ${label}
    </EagleButton>
  `,
  imports: ['import { EagleButton } from "@/components/elite/EagleButton"'],
  id: 'eagle-button',
  metadata: { nestable: true }
}
