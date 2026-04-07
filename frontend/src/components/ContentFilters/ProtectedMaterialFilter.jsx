import { Copyright } from 'lucide-react'
import FilterTestPage from './FilterTestPage'

export default function ProtectedMaterialFilter() {
  return (
    <FilterTestPage
      filterType="protected_material"
      title="Protected Material"
      subtitle="Copyright Detection"
      description="Detects and blocks model outputs that reproduce copyrighted or proprietary content verbatim. In capital markets this covers Bloomberg Terminal methodology documentation, proprietary sell-side research reports (Goldman Sachs, Morgan Stanley, JPMorgan), licensed risk model source code (MSCI Barra, Axioma), and commercial legal database content (Lexis Nexis, Westlaw). Protects the firm from IP litigation and licensing violations."
      icon={Copyright}
      color="#0ea5e9"
      guardRailLabel="Protected Material"
      financialContext="Financial firms rely heavily on commercially licensed data, research, and software. AI models trained on or prompted with this content may reproduce it verbatim, exposing the firm to copyright infringement claims from Bloomberg, major sell-side banks, and risk model vendors."
    />
  )
}
