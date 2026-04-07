import { EyeOff } from 'lucide-react'
import FilterTestPage from './FilterTestPage'

export default function PIIFilter() {
  return (
    <FilterTestPage
      filterType="pii"
      title="PII & Data Leakage"
      subtitle="Output Redaction"
      description="Blocks personally identifiable information from appearing in model and agent outputs. In financial services, this covers SSNs, account numbers, dates of birth, home addresses, salary data, and beneficiary details. The filter scans model outputs before they are returned to the user, catching both intentional PII exfiltration attempts and accidental context leakage from retrieved documents."
      icon={EyeOff}
      color="#10b981"
      guardRailLabel="PII Leakage Prevention"
      financialContext="Financial institutions are prime targets for PII exfiltration. A single AI agent interaction that leaks client SSNs or account numbers can trigger GDPR, GLBA, and CCPA breach notification requirements with significant regulatory penalties."
    />
  )
}
