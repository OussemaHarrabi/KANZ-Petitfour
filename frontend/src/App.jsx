import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { InvestorLayout, InspectorLayout } from './components/layout'
import { LanguageProvider } from './context/LanguageContext'
import RoleSelect from './pages/RoleSelect'

// Investor Pages
import Portfolio from './pages/investor/Portfolio'
import Market from './pages/investor/Market'
import Analysis from './pages/investor/Analysis'
import Watchlist from './pages/investor/Watchlist'
import Alerts from './pages/investor/Alerts'
import Simulator from './pages/investor/Simulator'
import Profile from './pages/investor/Profile'

// Inspector Pages
import Dashboard from './pages/inspector/Dashboard'
import Anomalies from './pages/inspector/Anomalies'
import Investigations from './pages/inspector/Investigations'
import Monitoring from './pages/inspector/Monitoring'
import DeepDive from './pages/inspector/DeepDive'
import Reports from './pages/inspector/Reports'

function App() {
  return (
    <LanguageProvider>
    <BrowserRouter>
      <Routes>
        {/* Role Selection - Entry Point */}
        <Route path="/" element={<RoleSelect />} />
        
        {/* Investor Dashboard Routes */}
        <Route path="/investor" element={<InvestorLayout />}>
          <Route index element={<Portfolio />} />
          <Route path="market" element={<Market />} />
          <Route path="analysis" element={<Analysis />} />
          <Route path="watchlist" element={<Watchlist />} />
          <Route path="alerts" element={<Alerts />} />
          <Route path="simulator" element={<Simulator />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* CMF Inspector Dashboard Routes */}
        <Route path="/inspector" element={<InspectorLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="anomalies" element={<Anomalies />} />
          <Route path="investigations" element={<Investigations />} />
          <Route path="monitoring" element={<Monitoring />} />
          <Route path="deep-dive" element={<DeepDive />} />
          <Route path="reports" element={<Reports />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </LanguageProvider>
  )
}

export default App
