// url=https://www.figma.com/design/aquila-pro-ds/EagleDesignSystem?node-id=101:1012
// source=src/ui/components/Tooltip.tsx
// component=Tooltip
import figma from 'figma'

const instance = figma.selectedInstance

const content = instance.getString('Content')
const placement = instance.getEnum('Placement', {
  'Top': 'top',
  'Bottom': 'bottom',
  'Left': 'left',
  'Right': 'right',
})
const children = instance.getSlot('Trigger')

export default {
  example: figma.code`
    <Tooltip content="${content}" placement="${placement}">
      ${children}
    </Tooltip>
  `,
  imports: ['import { Tooltip } from "@/components/Tooltip"'],
  id: 'tooltip',
  metadata: { nestable: true }
}
