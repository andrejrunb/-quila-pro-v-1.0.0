// url=https://www.figma.com/design/aquila-pro-ds/EagleDesignSystem?node-id=101:1002
// source=src/ui/components/elite/EagleCard.tsx
// component=EagleCard
import figma from 'figma'

const instance = figma.selectedInstance

const title = instance.getString('Title')
const variant = instance.getEnum('Variant', {
  'Default': 'default',
  'KPI': 'kpi',
  'Alert': 'alert',
  'Success': 'success',
})
const glow = instance.getBoolean('Glow')
const clickable = instance.getBoolean('Clickable')
const content = instance.getSlot('Content')

export default {
  example: figma.code`
    <EagleCard
      variant="${variant}"
      ${title ? figma.code`title="${title}"` : ''}
      ${glow ? 'glow' : ''}
      ${clickable ? 'clickable' : ''}
    >
      ${content}
    </EagleCard>
  `,
  imports: ['import { EagleCard } from "@/components/elite/EagleCard"'],
  id: 'eagle-card',
  metadata: { nestable: true }
}
