import { useState, useEffect } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../lib/utils'
import { useLanguage } from '../../context/LanguageContext'
import { api } from '../../services/api'
import { 
  LayoutDashboard, 
  TrendingUp, 
  TrendingDown,
  PieChart, 
  Star, 
  Bell,
  BarChart3,
  Search,
  FileText,
  Activity,
  Eye,
  Gamepad2,
  User,
  RefreshCw
} from 'lucide-react'

export function Sidebar({ role }) {
  const { t } = useLanguage()
  const [tunindex, setTunindex] = useState({ value: 9245.67, change: 0.49, loading: false })
  
  useEffect(() => {
    fetchTunindex()
    const interval = setInterval(fetchTunindex, 60000)
    return () => clearInterval(interval)
  }, [])

  async function fetchTunindex() {
    setTunindex(prev => ({ ...prev, loading: true }))
    try {
      const data = await api.market.liveTunindex()
      setTunindex({
        value: data.value || data.last || 9245.67,
        change: data.change_percent || data.changePercent || 0.49,
        loading: false
      })
    } catch (err) {
      setTunindex(prev => ({ ...prev, loading: false }))
    }
  }
  
  const investorLinks = [
    { to: '/investor', icon: LayoutDashboard, labelKey: 'nav.portfolio', end: true },
    { to: '/investor/market', icon: TrendingUp, labelKey: 'nav.market' },
    { to: '/investor/analysis', icon: BarChart3, labelKey: 'nav.analysis' },
    { to: '/investor/watchlist', icon: Star, labelKey: 'nav.watchlist' },
    { to: '/investor/alerts', icon: Bell, labelKey: 'nav.alerts' },
    { to: '/investor/simulator', icon: Gamepad2, labelKey: 'nav.simulator' },
    { to: '/investor/profile', icon: User, labelKey: 'nav.profile' },
  ]

  const inspectorLinks = [
    { to: '/inspector', icon: LayoutDashboard, labelKey: 'nav.dashboard', end: true },
    { to: '/inspector/anomalies', icon: Search, labelKey: 'nav.anomalies' },
    { to: '/inspector/investigations', icon: FileText, labelKey: 'nav.investigations' },
    { to: '/inspector/monitoring', icon: Activity, labelKey: 'nav.monitoring' },
    { to: '/inspector/deep-dive', icon: Eye, labelKey: 'nav.deepDive' },
    { to: '/inspector/reports', icon: PieChart, labelKey: 'nav.reports' },
  ]

  const links = role === 'inspector' ? inspectorLinks : investorLinks
  const roleLabel = role === 'inspector' ? t('roles.inspector') : t('roles.investor')
  const isPositive = tunindex.change >= 0

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-white border-r border-surface-200 flex flex-col z-40">
      <div className="p-6 border-b border-surface-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-bold text-surface-900">BVMT Trader</h1>
            <p className="text-xs text-surface-500">{roleLabel}</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) => cn(
              'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              isActive 
                ? 'bg-primary-50 text-primary-600' 
                : 'text-surface-600 hover:bg-surface-50 hover:text-surface-900'
            )}
          >
            <link.icon className="w-5 h-5" />
            {t(link.labelKey)}
          </NavLink>
        ))}
      </nav>

      <div className="p-4 border-t border-surface-100">
        <div className="bg-gradient-to-br from-primary-50 to-accent-50 rounded-xl p-4">
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs font-medium text-primary-700">{t('market.tunindex')}</p>
            <button 
              onClick={fetchTunindex}
              className="p-1 hover:bg-white/50 rounded transition-colors"
              disabled={tunindex.loading}
            >
              <RefreshCw className={`w-3 h-3 text-primary-600 ${tunindex.loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <p className="text-lg font-bold text-surface-900">{tunindex.value.toLocaleString('fr-FR', { minimumFractionDigits: 2 })}</p>
          <div className={`flex items-center gap-1 mt-0.5 ${isPositive ? 'text-success-600' : 'text-danger-600'}`}>
            {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="text-xs font-medium">{isPositive ? '+' : ''}{tunindex.change.toFixed(2)}% {t('common.today')}</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
