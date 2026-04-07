import { ShieldAlert } from 'lucide-react'
import FilterTestPage from './FilterTestPage'

export default function JailbreakFilter() {
  return (
    <FilterTestPage
      filterType="jailbreak"
      title="Jailbreak Protection"
      subtitle="Content Filter"
      description="Detects and blocks attempts to override model instructions, bypass compliance rules, or manipulate the AI into operating outside its defined role. Covers direct jailbreaks (DAN-style), persona hijacking, authority impersonation, fictional framing, and system prompt extraction attacks."
      icon={ShieldAlert}
      color="#ef4444"
      guardRailLabel="Jailbreak"
      financialContext="Capital markets AI assistants are high-value targets for jailbreaks - attackers attempt to remove compliance controls to obtain illegal trading advice or extract confidential configuration."
    />
  )
}
