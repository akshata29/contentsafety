import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout/Layout'
import CompliancePipeline from './components/CompliancePipeline/CompliancePipeline'
import Dashboard from './components/Dashboard/Dashboard'
import TextAnalysis from './components/ContentSafety/TextAnalysis'
import ImageAnalysis from './components/ContentSafety/ImageAnalysis'
import PromptShields from './components/ContentSafety/PromptShields'
import Groundedness from './components/ContentSafety/Groundedness'
import ProtectedMaterial from './components/ContentSafety/ProtectedMaterial'
import CustomCategories from './components/ContentSafety/CustomCategories'
import BlocklistManager from './components/ContentSafety/BlocklistManager'
import TaskAdherence from './components/ContentSafety/TaskAdherence'
import PIIDetection from './components/ContentSafety/PIIDetection'
import FoundryOverview from './components/FoundryControl/FoundryOverview'
import AgentFleet from './components/FoundryControl/AgentFleet'
import ModelDeployments from './components/FoundryControl/ModelDeployments'
import CompliancePolicies from './components/FoundryControl/CompliancePolicies'
import SecurityAlerts from './components/FoundryControl/SecurityAlerts'
import QuotaManagement from './components/FoundryControl/QuotaManagement'
import AdminProjects from './components/FoundryControl/AdminProjects'
import ArchitecturePage from './pages/ArchitecturePage'
import WalkthroughIndex from './pages/walkthrough/WalkthroughIndex'
import WalkthroughChapter from './pages/walkthrough/WalkthroughChapter'
import WorkflowPage from './pages/WorkflowPage'
import DemoPage from './pages/DemoPage'
import SettingsPage from './pages/SettingsPage'
import WhenToUsePage from './pages/WhenToUsePage'
import PatternScenarios from './components/CompliancePipeline/PatternScenarios'
import GuardrailManager from './components/ContentFilters/GuardrailManager'
import PromptShieldFilter from './components/ContentFilters/PromptShieldFilter'
import JailbreakFilter from './components/ContentFilters/JailbreakFilter'
import XPIAFilter from './components/ContentFilters/XPIAFilter'
import ContentSafetyFilter from './components/ContentFilters/ContentSafetyFilter'
import TaskAdherenceFilter from './components/ContentFilters/TaskAdherenceFilter'
import PIIFilter from './components/ContentFilters/PIIFilter'
import ProtectedMaterialFilter from './components/ContentFilters/ProtectedMaterialFilter'
import GroundednessFilter from './components/ContentFilters/GroundednessFilter'
import ModelFilterTest from './components/ContentFilters/ModelFilterTest'
import AgentFilterTest from './components/ContentFilters/AgentFilterTest'
import FilterComparison from './components/ContentFilters/FilterComparison'
import FilterAnalytics from './components/ContentFilters/FilterAnalytics'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/pipeline" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pipeline" element={<CompliancePipeline />} />
          <Route path="pipeline/patterns" element={<PatternScenarios />} />

          {/* Content Safety */}
          <Route path="content-safety/text" element={<TextAnalysis />} />
          <Route path="content-safety/image" element={<ImageAnalysis />} />
          <Route path="content-safety/prompt-shields" element={<PromptShields />} />
          <Route path="content-safety/groundedness" element={<Groundedness />} />
          <Route path="content-safety/protected-material" element={<ProtectedMaterial />} />
          <Route path="content-safety/custom-categories" element={<CustomCategories />} />
          <Route path="content-safety/blocklists" element={<BlocklistManager />} />
          <Route path="content-safety/task-adherence" element={<TaskAdherence />} />
          <Route path="content-safety/pii-detection" element={<PIIDetection />} />

          {/* Content Filters */}
          <Route path="content-filters/guardrails"         element={<GuardrailManager />} />
          <Route path="content-filters/prompt-shield"      element={<PromptShieldFilter />} />
          <Route path="content-filters/jailbreak"          element={<JailbreakFilter />} />
          <Route path="content-filters/xpia"               element={<XPIAFilter />} />
          <Route path="content-filters/content-safety"     element={<ContentSafetyFilter />} />
          <Route path="content-filters/task-adherence"     element={<TaskAdherenceFilter />} />
          <Route path="content-filters/pii-leakage"        element={<PIIFilter />} />
          <Route path="content-filters/protected-material" element={<ProtectedMaterialFilter />} />
          <Route path="content-filters/groundedness"        element={<GroundednessFilter />} />
          <Route path="content-filters/model-test"         element={<ModelFilterTest />} />
          <Route path="content-filters/agent-test"         element={<AgentFilterTest />} />
          <Route path="content-filters/compare"            element={<FilterComparison />} />
          <Route path="content-filters/analytics"          element={<FilterAnalytics />} />

          {/* Foundry Control Plane */}
          <Route path="foundry/overview" element={<FoundryOverview />} />
          <Route path="foundry/agents" element={<AgentFleet />} />
          <Route path="foundry/deployments" element={<ModelDeployments />} />
          <Route path="foundry/compliance" element={<CompliancePolicies />} />
          <Route path="foundry/security" element={<SecurityAlerts />} />
          <Route path="foundry/quota" element={<QuotaManagement />} />
          <Route path="foundry/admin" element={<AdminProjects />} />

          {/* Demo Walkthrough */}
          <Route path="walkthrough" element={<WalkthroughIndex />} />
          <Route path="walkthrough/:n" element={<WalkthroughChapter />} />

          {/* Design / Artifacts */}
          <Route path="architecture" element={<ArchitecturePage />} />
          <Route path="workflow" element={<WorkflowPage />} />
          <Route path="demo" element={<DemoPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="when-to-use" element={<WhenToUsePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}
