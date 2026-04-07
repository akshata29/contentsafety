import { AlertOctagon } from 'lucide-react'
import FilterTestPage from './FilterTestPage'

export default function ContentSafetyFilter() {
  return (
    <FilterTestPage
      filterType="content_safety"
      title="Content Safety Filters"
      subtitle="Harm Categories"
      description="Configurable thresholds for the four core harm categories - Hate, Violence, Sexual, and Self-Harm - applied at both input and output layers. In capital markets, these filters catch threats directed at regulators or colleagues, discriminatory investment strategies, trader distress signals, and hostile communications before they propagate through firm systems."
      icon={AlertOctagon}
      color="#f97316"
      guardRailLabel="Content Safety"
      financialContext="Trading desks operate under extreme pressure. Content safety filters on financial AI tools catch harassment, threats, and trader wellbeing signals that compliance teams may otherwise miss in high-volume communication workflows."
    />
  )
}
