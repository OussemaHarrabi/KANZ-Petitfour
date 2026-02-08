import { Bell, TrendingUp, AlertTriangle, Check, Volume2, MoreVertical, Plus, Settings } from 'lucide-react'
import { Card, Badge, Button } from '../../components/ui'
import { formatTime } from '../../lib/utils'
import { ALERTS } from '../../data/portfolio'

const alertIcons = {
  price_target: TrendingUp,
  volume_spike: Volume2,
  recommendation: Check,
  portfolio: TrendingUp,
  price_drop: AlertTriangle,
}

const alertColors = {
  price_target: 'bg-success-100 text-success-600',
  volume_spike: 'bg-warning-100 text-warning-600',
  recommendation: 'bg-primary-100 text-primary-600',
  portfolio: 'bg-accent-100 text-accent-600',
  price_drop: 'bg-danger-100 text-danger-600',
}

export default function Alerts() {
  const unreadCount = ALERTS.filter(a => !a.read).length

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Alerts</h1>
          <p className="text-surface-500">
            {unreadCount > 0 ? `${unreadCount} unread notifications` : 'All caught up!'}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary">
            <Settings className="w-4 h-4" />
            Settings
          </Button>
          <Button>
            <Plus className="w-4 h-4" />
            New Alert
          </Button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {['All', 'Price', 'Volume', 'AI Signals', 'Portfolio'].map((filter) => (
          <button
            key={filter}
            className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              filter === 'All'
                ? 'bg-primary-500 text-white shadow-md'
                : 'bg-white border border-surface-200 text-surface-600 hover:border-primary-300'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {ALERTS.map((alert) => {
          const Icon = alertIcons[alert.type] || Bell
          const colorClass = alertColors[alert.type] || 'bg-surface-100 text-surface-600'
          
          return (
            <Card 
              key={alert.id} 
              className={`p-4 transition-all ${!alert.read ? 'border-l-4 border-l-primary-500 bg-primary-50/30' : ''}`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-2.5 rounded-xl ${colorClass}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    {alert.symbol && (
                      <Badge variant="outline" size="sm">{alert.symbol}</Badge>
                    )}
                    {!alert.read && (
                      <Badge variant="primary" size="sm">New</Badge>
                    )}
                  </div>
                  <p className={`text-sm ${!alert.read ? 'font-medium text-surface-900' : 'text-surface-600'}`}>
                    {alert.message}
                  </p>
                  <p className="text-xs text-surface-400 mt-1">
                    {new Date(alert.timestamp).toLocaleString()}
                  </p>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors">
                  <MoreVertical className="w-4 h-4 text-surface-400" />
                </button>
              </div>
            </Card>
          )
        })}
      </div>

      {ALERTS.length === 0 && (
        <Card className="p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
            <Bell className="w-8 h-8 text-surface-400" />
          </div>
          <h3 className="text-lg font-semibold text-surface-900 mb-2">No alerts yet</h3>
          <p className="text-surface-500 mb-4">Set up price alerts to get notified about market movements</p>
          <Button>
            <Plus className="w-4 h-4" />
            Create Your First Alert
          </Button>
        </Card>
      )}
    </div>
  )
}
