import { FileWarning } from 'lucide-react'
import FilterTestPage from './FilterTestPage'

export default function XPIAFilter() {
  return (
    <FilterTestPage
      filterType="xpia"
      title="Indirect Prompt Injection"
      subtitle="XPIA Filter"
      description="Blocks cross-prompt injection attacks (XPIA) where malicious instructions are hidden inside external content processed by the model - earnings reports, tool API responses, knowledge base documents, and client emails. The filter scans all document inputs and tool outputs before they reach the model context."
      icon={FileWarning}
      color="#8b5cf6"
      guardRailLabel="Indirect Injection (XPIA)"
      financialContext="Agentic financial workflows process large volumes of third-party documents and API outputs. Attackers embed hidden instructions in these sources to hijack agent behavior, redirect fund transfers, or exfiltrate trading data."
    />
  )
}
