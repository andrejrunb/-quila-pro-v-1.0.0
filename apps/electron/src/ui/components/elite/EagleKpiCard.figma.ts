// url=https://www.figma.com/design/aquila-pro-ds/EagleDesignSystem?node-id=101:1004
// source=src/ui/components/elite/EagleKpiCard.tsx
// component=EagleKpiCard
import figma from 'figma'

const instance = figma.selectedInstance

const title = instance.getString('Title')
const value = instance.getString('Value')
const glow = instance.getBoolean('Glow')
const trendColor = instance.getString('TrendColor')

export default {
  example: figma.code`
    <EagleKpiCard
      title="${title}"
      value="${value}"
      trendColor="${trendColor || '#3b82f6'}"
      ${glow ? 'glow' : ''}
      icon={<Activity className="w-5 h-5" />}
    />
  `,
  imports: [
    'import { EagleKpiCard } from "@/components/elite/EagleKpiCard"',
    'import { Activity } from "lucide-react"'
  ],
  id: 'eagle-kpi-card',
  metadata: { nestable: true }
}
