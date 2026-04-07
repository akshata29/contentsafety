import { GitBranch } from 'lucide-react'
import FilterTestPage from './FilterTestPage'

export default function TaskAdherenceFilter() {
  return (
    <FilterTestPage
      filterType="task_adherence"
      title="Task Adherence"
      subtitle="Task Drift Filter"
      description="Prevents AI agents from drifting outside their designated role and task scope. Financial agents are highly specialized - a SAR-filing agent must never execute trades, a compliance agent must never approve fraudulent transactions, and a research agent must never access production systems. This filter enforces strict task boundaries regardless of how the request is framed."
      icon={GitBranch}
      color="#6366f1"
      guardRailLabel="Task Adherence"
      financialContext="Specialized capital markets agents operate with privileged access to sensitive systems. Task drift - where an agent is manipulated into performing actions outside its mandate - creates direct regulatory, financial, and reputational risk."
    />
  )
}
