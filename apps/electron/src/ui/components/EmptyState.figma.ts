// url=https://www.figma.com/design/aquila-pro-ds/EagleDesignSystem?node-id=101:1010
// source=src/ui/components/EmptyState.tsx
// component=EmptyState
import figma from 'figma'

const instance = figma.selectedInstance

const title = instance.getString('Title')
const description = instance.getString('Description')
const size = instance.getEnum('Size', {
  'Small': 'sm',
  'Medium': 'md',
  'Large': 'lg',
})

export default {
  example: figma.code`
    <EmptyState
      title="${title}"
      ${description ? figma.code`description="${description}"` : ''}
      size="${size}"
    />
  `,
  imports: ['import { EmptyState } from "@/components/EmptyState"'],
  id: 'empty-state',
  metadata: { nestable: true }
}
