import { useState } from 'react'
import { Card, CardContent, Badge, Button } from '../../components/ui'
import { PriceChart, Sparkline } from '../../components/charts'
import { formatCurrency, formatPercent, formatNumber } from '../../lib/utils'
import { STOCKS, generatePriceHistory, generateSparklineData } from '../../data/stocks'
import { ANOMALIES } from '../../data/anomalies'
import { Search, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Activity, Users, Clock } from 'lucide-react'

export default function DeepDive() {
  const [selectedStock, setSelectedStock] = useState(STOCKS[0])
  
  const priceHistory = generatePriceHistory(selectedStock.price, 30)
  const stockAnomalies = ANOMALIES.filter(a => a.symbol === selectedStock.symbol)
  
  // Mock deep dive data
  const tradingMetrics = {
    avgDailyVolume: selectedStock.volume * 0.8,
    volatility: 2.4 + Math.random() * 3,
    beta: 0.8 + Math.random() * 0.5,
    sharpeRatio: 0.5 + Math.random() * 1.5,
    maxDrawdown: -(5 + Math.random() * 15),
  }

  const topTraders = [
    { name: 'Broker A', volume: 125000, percentage: 23 },
    { name: 'Broker B', volume: 98000, percentage: 18 },
    { name: 'Broker C', volume: 76000, percentage: 14 },
    { name: 'Broker D', volume: 54000, percentage: 10 },
    { name: 'Others', volume: 192000, percentage: 35 },
  ]

  const recentPatterns = [
    { pattern: 'Large block trades', frequency: 'High', risk: 'medium' },
    { pattern: 'End-of-day volume spike', frequency: 'Medium', risk: 'low' },
    { pattern: 'Price gap patterns', frequency: 'Low', risk: 'high' },
    { pattern: 'Order book imbalance', frequency: 'Medium', risk: 'medium' },
  ]

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Stock Deep Dive</h1>
          <p className="text-surface-500">Comprehensive stock analysis for surveillance</p>
        </div>
      </div>

      {/* Stock Selector */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Search className="w-5 h-5 text-surface-400" />
            <span className="text-sm text-surface-500">Select a stock to analyze:</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {STOCKS.map((stock) => (
              <Button
                key={stock.symbol}
                variant={selectedStock.symbol === stock.symbol ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedStock(stock)}
              >
                {stock.symbol}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stock Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardContent className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold text-surface-900">{selectedStock.symbol}</h2>
                  <Badge variant="outline">{selectedStock.sector}</Badge>
                </div>
                <p className="text-surface-500">{selectedStock.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-surface-900">
                  {formatCurrency(selectedStock.price)}
                </p>
                <p className={`flex items-center justify-end gap-1 text-sm font-medium ${
                  selectedStock.change >= 0 ? 'text-success-600' : 'text-danger-600'
                }`}>
                  {selectedStock.change >= 0 ? (
                    <TrendingUp className="w-4 h-4" />
                  ) : (
                    <TrendingDown className="w-4 h-4" />
                  )}
                  {formatPercent(selectedStock.change)}
                </p>
              </div>
            </div>
            <PriceChart data={priceHistory} height={250} />
          </CardContent>
        </Card>

        <div className="space-y-4">
          {/* Anomaly Alert */}
          <Card className={stockAnomalies.length > 0 ? 'border-warning-200 bg-warning-50/50' : ''}>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className={`w-5 h-5 ${stockAnomalies.length > 0 ? 'text-warning-500' : 'text-surface-400'}`} />
                <h3 className="font-semibold text-surface-900">Anomaly Status</h3>
              </div>
              {stockAnomalies.length > 0 ? (
                <div className="space-y-2">
                  {stockAnomalies.slice(0, 2).map((anomaly) => (
                    <div key={anomaly.id} className="p-2 bg-white rounded-lg">
                      <p className="text-sm font-medium text-surface-900">{anomaly.title}</p>
                      <Badge variant="warning" size="sm">{anomaly.status}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-success-600">No active anomalies detected</p>
              )}
            </CardContent>
          </Card>

          {/* Trading Metrics */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 className="w-5 h-5 text-primary-500" />
                <h3 className="font-semibold text-surface-900">Trading Metrics</h3>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-surface-500">Avg Daily Volume</span>
                  <span className="text-sm font-medium text-surface-900">
                    {formatNumber(tradingMetrics.avgDailyVolume)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-surface-500">Volatility</span>
                  <span className="text-sm font-medium text-surface-900">
                    {tradingMetrics.volatility.toFixed(2)}%
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-surface-500">Beta</span>
                  <span className="text-sm font-medium text-surface-900">
                    {tradingMetrics.beta.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-surface-500">Sharpe Ratio</span>
                  <span className="text-sm font-medium text-surface-900">
                    {tradingMetrics.sharpeRatio.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-surface-500">Max Drawdown</span>
                  <span className="text-sm font-medium text-danger-600">
                    {tradingMetrics.maxDrawdown.toFixed(2)}%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Traders */}
        <Card>
          <div className="p-4 border-b border-surface-100">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-accent-500" />
              <h3 className="font-semibold text-surface-900">Top Brokers by Volume</h3>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="space-y-4">
              {topTraders.map((trader, index) => (
                <div key={trader.name}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-surface-900">{trader.name}</span>
                    <span className="text-sm text-surface-500">
                      {formatNumber(trader.volume)} ({trader.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-primary-500 to-accent-500 rounded-full"
                      style={{ width: `${trader.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Patterns */}
        <Card>
          <div className="p-4 border-b border-surface-100">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary-500" />
              <h3 className="font-semibold text-surface-900">Detected Patterns</h3>
            </div>
          </div>
          <CardContent className="p-4">
            <div className="space-y-3">
              {recentPatterns.map((pattern) => (
                <div 
                  key={pattern.pattern}
                  className="flex items-center justify-between p-3 bg-surface-50 rounded-lg"
                >
                  <div>
                    <p className="text-sm font-medium text-surface-900">{pattern.pattern}</p>
                    <p className="text-xs text-surface-500">Frequency: {pattern.frequency}</p>
                  </div>
                  <Badge 
                    variant={
                      pattern.risk === 'high' ? 'danger' :
                      pattern.risk === 'medium' ? 'warning' : 'success'
                    }
                    size="sm"
                  >
                    {pattern.risk} risk
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Historical Analysis */}
      <Card>
        <div className="p-4 border-b border-surface-100">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-surface-500" />
            <h3 className="font-semibold text-surface-900">30-Day Price History</h3>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-surface-50">
                <th className="text-left text-xs font-medium text-surface-500 px-4 py-3">Date</th>
                <th className="text-right text-xs font-medium text-surface-500 px-4 py-3">Open</th>
                <th className="text-right text-xs font-medium text-surface-500 px-4 py-3">High</th>
                <th className="text-right text-xs font-medium text-surface-500 px-4 py-3">Low</th>
                <th className="text-right text-xs font-medium text-surface-500 px-4 py-3">Close</th>
                <th className="text-right text-xs font-medium text-surface-500 px-4 py-3">Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {priceHistory.slice(-7).reverse().map((day, index) => {
                const change = ((day.close - day.open) / day.open) * 100
                return (
                  <tr key={index} className="hover:bg-surface-50">
                    <td className="px-4 py-3 text-sm text-surface-900">{day.date}</td>
                    <td className="px-4 py-3 text-sm text-surface-600 text-right">{day.open.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-success-600 text-right">{day.high.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm text-danger-600 text-right">{day.low.toFixed(2)}</td>
                    <td className="px-4 py-3 text-sm font-medium text-surface-900 text-right">{day.close.toFixed(2)}</td>
                    <td className={`px-4 py-3 text-sm font-medium text-right ${change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                      {change >= 0 ? '+' : ''}{change.toFixed(2)}%
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}
