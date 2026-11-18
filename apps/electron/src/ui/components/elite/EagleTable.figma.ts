// url=https://www.figma.com/design/aquila-pro-ds/EagleDesignSystem?node-id=101:1008
// source=src/ui/components/elite/EagleTable.tsx
// component=EagleTable
import figma from 'figma'

const instance = figma.selectedInstance

const isEmpty = instance.getBoolean('Empty')
const emptyMessage = instance.getString('EmptyMessage')
const content = instance.getSlot('Content')

export default {
  example: figma.code`
    <EagleTable
      ${isEmpty ? 'isEmpty' : ''}
      ${emptyMessage ? figma.code`emptyMessage="${emptyMessage}"` : ''}
    >
      ${content}
    </EagleTable>
  `,
  imports: ['import { EagleTable } from "@/components/elite/EagleTable"'],
  id: 'eagle-table',
  metadata: { nestable: true }
}
