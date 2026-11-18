// url=https://www.figma.com/design/aquila-pro-ds/EagleDesignSystem?node-id=101:1007
// source=src/ui/components/elite/EagleModal.tsx
// component=EagleModal
import figma from 'figma'

const instance = figma.selectedInstance

const title = instance.getString('Title')
const size = instance.getEnum('Size', {
  'Small': 'sm',
  'Medium': 'md',
  'Large': 'lg',
})
const isOpen = instance.getBoolean('Open')
const content = instance.getSlot('Content')

export default {
  example: figma.code`
    <EagleModal
      ${isOpen ? 'isOpen' : 'isOpen={false}'}
      size="${size}"
      ${title ? figma.code`title="${title}"` : ''}
      onClose={() => console.log('close')}
    >
      ${content}
    </EagleModal>
  `,
  imports: ['import { EagleModal } from "@/components/elite/EagleModal"'],
  id: 'eagle-modal',
  metadata: { nestable: false }
}
