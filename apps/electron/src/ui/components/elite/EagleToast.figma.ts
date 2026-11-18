// url=https://www.figma.com/design/aquila-pro-ds/EagleDesignSystem?node-id=101:1009
// source=src/ui/components/elite/EagleToast.tsx
// component=EagleToastItem
import figma from 'figma'

const instance = figma.selectedInstance

const message = instance.getString('Message')
const variant = instance.getEnum('Variant', {
  'Success': 'success',
  'Error': 'error',
  'Warning': 'warning',
  'Info': 'info',
})

export default {
  example: figma.code`
    <EagleToastItem
      id="toast-preview"
      message="${message}"
      variant="${variant}"
      onClose={(id) => console.log('closed', id)}
    />
  `,
  imports: ['import { EagleToastItem } from "@/components/elite/EagleToast"'],
  id: 'eagle-toast-item',
  metadata: { nestable: true }
}
