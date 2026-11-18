// url=https://www.figma.com/design/aquila-pro-ds/EagleDesignSystem?node-id=101:1011
// source=src/ui/components/Skeleton.tsx
// component=Skeleton
import figma from 'figma'

const instance = figma.selectedInstance

const type = instance.getEnum('Type', {
  'Card': 'Card',
  'TableRow': 'TableRow',
  'TextBlock': 'TextBlock',
  'KPICard': 'KPICard',
  'Avatar': 'Avatar',
  'Button': 'Button',
})

export default {
  example: figma.code`
    <Skeleton.${type} />
  `,
  imports: ['import { Skeleton } from "@/components/Skeleton"'],
  id: 'skeleton',
  metadata: { nestable: true }
}
