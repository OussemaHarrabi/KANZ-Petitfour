import { useState, useEffect } from 'react'
import { Card, CardContent, Badge, Button } from '../../components/ui'
import { formatTime, formatCurrency } from '../../lib/utils'
import { ACTIVITY_FEED } from '../../data/anomalies'
import { Activity, Filter, Pause, Play, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react'

export default function Monitoring() {
  const [isPaused, setIsPaused] = useState(false)
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false)
  const [activities, setActivities] = useState(ACTIVITY_FEED)

  // Simulated real-time updates
  useEffect(() => {
    if (isPaused) return

    const interval = setInterval(() => {
      const symbols = ['BIAT', 'SFBT', 'ATB', 'UIB', 'STAR', 'POULINA', 'BH', 'BNA']
      const newActivity = {
        id: Date.now(),
        type: Math.random() > 0.3 ? 'trade' : 'order',
        symbol: symbols[Math.floor(Math.random() * symbols.length)],
        action: Math.random() > 0.5 ? 'buy' : 'sell',
        shares: Math.floor(Math.random() * 5000) + 100,
        price: Math.floor(Math.random() * 150) + 5 + Math.random(),
        timestamp: new Date().toISOString(),
        flagged: Math.random() > 0.85,
      }
      setActivities(prev => [newActivity, ...prev.slice(0, 49)])
    }, 3000)

    return () => clearInterval(interval)
  }, [isPaused])

  const displayedActivities = showFlaggedOnly 
    ? activities.filter(a => a.flagged)
    : activities

  const stats = {
    totalTrades: activities.filter(a => a.type === 'trade').length,
    totalOrders: activities.filter(a => a.type === 'order').length,
    flaggedCount: activities.filter(a => a.flagged).length,
    buyVolume: activities.filter(a => a.action === 'buy').reduce((sum, a) => sum + a.shares, 0),
    sellVolume: activities.filter(a => a.action === 'sell').reduce((sum, a) => sum + a.shares, 0),
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Real-time Monitoring</h1>
          <p className="text-surface-500">Live market activity surveillance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={showFlaggedOnly ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setShowFlaggedOnly(!showFlaggedOnly)}
          >
            <Filter className="w-4 h-4 mr-2" />
            {showFlaggedOnly ? 'Showing Flagged' : 'Show All'}
          </Button>
          <Button
            variant={isPaused ? 'success' : 'danger'}
            size="sm"
            onClick={() => setIsPaused(!isPaused)}
          >
            {isPaused ? (
              <>
                <Play className="w-4 h-4 mr-2" />
                Resume
              </>
            ) : (
              <>
                <Pause className="w-4 h-4 mr-2" />
                Pause
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Live Status Banner */}
      <div className={`p-4 rounded-xl flex items-center justify-between ${
        isPaused ? 'bg-warning-50 border border-warning-200' : 'bg-success-50 border border-success-200'
      }`}>
        <div className="flex items-center gap-3">
          <span className={`w-3 h-3 rounded-full ${isPaused ? 'bg-warning-500' : 'bg-success-500 animate-pulse'}`} />
          <span className={`font-medium ${isPaused ? 'text-warning-700' : 'text-success-700'}`}>
            {isPaused ? 'Feed Paused' : 'Live Feed Active'}
          </span>
        </div>
        <span className="text-sm text-surface-500">
          Last update: {formatTime(new Date().toISOString())}
        </span>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card className="p-4">
          <p className="text-sm text-surface-500">Total Trades</p>
          <p className="text-2xl font-bold text-surface-900">{stats.totalTrades}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-surface-500">Total Orders</p>
          <p className="text-2xl font-bold text-surface-900">{stats.totalOrders}</p>
        </Card>
        <Card className="p-4 border-danger-200">
          <p className="text-sm text-surface-500">Flagged</p>
          <p className="text-2xl font-bold text-danger-600">{stats.flaggedCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-surface-500">Buy Volume</p>
          <p className="text-2xl font-bold text-success-600">{stats.buyVolume.toLocaleString()}</p>
        </Card>
        <Card className="p-4">
          <p className="text-sm text-surface-500">Sell Volume</p>
          <p className="text-2xl font-bold text-danger-600">{stats.sellVolume.toLocaleString()}</p>
        </Card>
      </div>

      {/* Activity Feed */}
      <Card>
        <div className="p-4 border-b border-surface-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent-500" />
            <h3 className="font-semibold text-surface-900">Activity Stream</h3>
            {!isPaused && (
              <span className="flex items-center gap-1 text-xs text-success-600 bg-success-50 px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 bg-success-500 rounded-full animate-pulse" />
                Live
              </span>
            )}
          </div>
          <span className="text-sm text-surface-500">
            {displayedActivities.length} activities
          </span>
        </div>
        
        <div className="max-h-[500px] overflow-y-auto">
          <div className="divide-y divide-surface-100">
            {displayedActivities.map((activity, index) => (
              <div 
                key={activity.id} 
                className={`p-4 flex items-center gap-4 hover:bg-surface-50 transition-all ${
                  activity.flagged ? 'bg-danger-50/50' : ''
                } ${index === 0 && !isPaused ? 'animate-slide-up' : ''}`}
              >
                {/* Action Icon */}
                <div className={`p-2 rounded-lg ${
                  activity.action === 'buy' ? 'bg-success-100' : 'bg-danger-100'
                }`}>
                  {activity.action === 'buy' ? (
                    <TrendingUp className="w-5 h-5 text-success-600" />
                  ) : (
                    <TrendingDown className="w-5 h-5 text-danger-600" />
                  )}
                </div>

                {/* Details */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-surface-900">{activity.symbol}</span>
                    <Badge variant="outline" size="sm">{activity.type}</Badge>
                    {activity.flagged && (
                      <Badge variant="danger" size="sm" dot>
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Flagged
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-surface-500">
                    <span className={activity.action === 'buy' ? 'text-success-600' : 'text-danger-600'}>
                      {activity.action.toUpperCase()}
                    </span>
                    {' '}
                    {activity.shares.toLocaleString()} shares @ {activity.price.toFixed(2)} TND
                  </p>
                </div>

                {/* Time & Value */}
                <div className="text-right">
                  <p className="text-sm font-medium text-surface-900">
                    {formatCurrency(activity.shares * activity.price)}
                  </p>
                  <p className="text-xs text-surface-400">
                    {formatTime(activity.timestamp)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {displayedActivities.length === 0 && (
          <div className="p-8 text-center">
            <Activity className="w-12 h-12 text-surface-300 mx-auto mb-3" />
            <p className="text-surface-500">No flagged activities</p>
          </div>
        )}
      </Card>
    </div>
  )
}
