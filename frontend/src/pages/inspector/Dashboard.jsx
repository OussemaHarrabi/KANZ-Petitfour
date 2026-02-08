import { Card, CardContent, Badge, Button } from '../../components/ui'
import { Sparkline } from '../../components/charts'
import { formatTime } from '../../lib/utils'
import { ANOMALIES, INVESTIGATIONS, ACTIVITY_FEED } from '../../data/anomalies'
import { AlertTriangle, Shield, Search, Activity, TrendingUp, Eye, ArrowRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const severityColors = {
  critical: 'danger',
  high: 'warning',
  medium: 'primary',
  low: 'default',
}

const statusColors = {
  investigating: 'warning',
  confirmed: 'danger',
  reviewing: 'primary',
  dismissed: 'default',
  active: 'success',
  pending: 'warning',
  completed: 'default',
}

export default function Dashboard() {
  const navigate = useNavigate()
  
  const criticalAnomalies = ANOMALIES.filter(a => a.severity === 'critical').length
  const activeInvestigations = INVESTIGATIONS.filter(i => i.status === 'active').length
  const flaggedTrades = ACTIVITY_FEED.filter(t => t.flagged).length
  
  const stats = [
    {
      label: 'Total Anomalies',
      value: ANOMALIES.length,
      icon: AlertTriangle,
      change: '+2 today',
      changeType: 'warning',
      gradient: 'from-orange-500 to-red-500',
    },
    {
      label: 'Critical Alerts',
      value: criticalAnomalies,
      icon: Shield,
      change: 'Requires action',
      changeType: 'danger',
      gradient: 'from-red-500 to-pink-500',
    },
    {
      label: 'Active Investigations',
      value: activeInvestigations,
      icon: Search,
      change: '60% avg progress',
      changeType: 'success',
      gradient: 'from-primary-500 to-accent-500',
    },
    {
      label: 'Flagged Trades',
      value: flaggedTrades,
      icon: Activity,
      change: 'Last hour',
      changeType: 'primary',
      gradient: 'from-accent-500 to-cyan-500',
    },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Surveillance Dashboard</h1>
          <p className="text-surface-500">Real-time market monitoring and anomaly detection</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-success-50 rounded-full">
            <span className="w-2 h-2 bg-success-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium text-success-700">System Active</span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="relative overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`} />
            <CardContent className="p-4 relative">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-surface-500">{stat.label}</p>
                  <p className="text-3xl font-bold text-surface-900 mt-1">{stat.value}</p>
                  <Badge variant={stat.changeType} size="sm" className="mt-2">
                    {stat.change}
                  </Badge>
                </div>
                <div className={`p-3 rounded-xl bg-gradient-to-br ${stat.gradient}`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Anomalies */}
        <Card>
          <div className="p-4 border-b border-surface-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning-500" />
              <h3 className="font-semibold text-surface-900">Recent Anomalies</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/inspector/anomalies')}
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="divide-y divide-surface-100">
            {ANOMALIES.slice(0, 4).map((anomaly) => (
              <div key={anomaly.id} className="p-4 hover:bg-surface-50 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-surface-900">{anomaly.symbol}</span>
                      <Badge variant={severityColors[anomaly.severity]} size="sm">
                        {anomaly.severity}
                      </Badge>
                    </div>
                    <p className="text-sm text-surface-600 mt-1">{anomaly.title}</p>
                    <p className="text-xs text-surface-400 mt-1">
                      {formatTime(anomaly.detectedAt)}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge variant={statusColors[anomaly.status]} size="sm" dot>
                      {anomaly.status}
                    </Badge>
                    <p className="text-xs text-surface-400 mt-2">
                      {anomaly.confidence}% confidence
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Active Investigations */}
        <Card>
          <div className="p-4 border-b border-surface-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold text-surface-900">Active Investigations</h3>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/inspector/investigations')}
            >
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="divide-y divide-surface-100">
            {INVESTIGATIONS.filter(i => i.status !== 'completed').slice(0, 3).map((inv) => (
              <div key={inv.id} className="p-4 hover:bg-surface-50 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-surface-900">{inv.title}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant={statusColors[inv.priority]} size="sm">
                        {inv.priority}
                      </Badge>
                      <span className="text-xs text-surface-400">{inv.assignee}</span>
                    </div>
                  </div>
                  <Badge variant={statusColors[inv.status]} size="sm" dot>
                    {inv.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-500 transition-all"
                      style={{ width: `${inv.progress}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-surface-600">{inv.progress}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Live Activity Feed */}
      <Card>
        <div className="p-4 border-b border-surface-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent-500" />
            <h3 className="font-semibold text-surface-900">Live Activity Feed</h3>
            <span className="flex items-center gap-1 text-xs text-success-600 bg-success-50 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse" />
              Live
            </span>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => navigate('/inspector/monitoring')}
          >
            Full Monitor <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50">
                <th className="text-left text-xs font-medium text-surface-500 px-4 py-3">Time</th>
                <th className="text-left text-xs font-medium text-surface-500 px-4 py-3">Type</th>
                <th className="text-left text-xs font-medium text-surface-500 px-4 py-3">Symbol</th>
                <th className="text-left text-xs font-medium text-surface-500 px-4 py-3">Action</th>
                <th className="text-right text-xs font-medium text-surface-500 px-4 py-3">Shares</th>
                <th className="text-right text-xs font-medium text-surface-500 px-4 py-3">Price</th>
                <th className="text-center text-xs font-medium text-surface-500 px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {ACTIVITY_FEED.slice(0, 5).map((activity) => (
                <tr 
                  key={activity.id} 
                  className={`hover:bg-surface-50 transition-colors ${activity.flagged ? 'bg-danger-50/30' : ''}`}
                >
                  <td className="px-4 py-3 text-sm text-surface-600">
                    {formatTime(activity.timestamp)}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" size="sm">
                      {activity.type}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 font-medium text-surface-900">
                    {activity.symbol}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${activity.action === 'buy' ? 'text-success-600' : 'text-danger-600'}`}>
                      {activity.action.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-sm text-surface-600">
                    {activity.shares.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium text-surface-900">
                    {activity.price.toFixed(2)} TND
                  </td>
                  <td className="px-4 py-3 text-center">
                    {activity.flagged ? (
                      <Badge variant="danger" size="sm" dot>Flagged</Badge>
                    ) : (
                      <Badge variant="success" size="sm">Normal</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
