import { useMemo } from 'react'
import { TrendingUp, TrendingDown, ArrowUpRight, MoreVertical, Loader2, Target, Shield, AlertTriangle, BarChart3 } from 'lucide-react'
import { Card, CardContent, Badge } from '../../components/ui'
import { Sparkline } from '../../components/charts'
import { formatCurrency, formatPercent } from '../../lib/utils'
import { usePortfolio } from '../../services'
import { generateSparklineData } from '../../data/stocks'
import { useLanguage } from '../../context/LanguageContext'

function calculateMetrics(holdings, summary) {
  const returns = holdings.map(h => h.gainPercent / 100)
  const avgReturn = returns.length > 0 ? returns.reduce((a, b) => a + b, 0) / returns.length : 0
  const variance = returns.length > 0 
    ? returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length 
    : 0
  const stdDev = Math.sqrt(variance)
  
  const riskFreeRate = 0.07 / 12
  const sharpeRatio = stdDev > 0 ? (avgReturn - riskFreeRate) / stdDev : 0
  
  const drawdowns = returns.map((_, i) => {
    const peak = Math.max(...returns.slice(0, i + 1).map(r => 1 + r))
    const current = 1 + returns[i]
    return (peak - current) / peak
  })
  const maxDrawdown = Math.max(...drawdowns, 0) * 100
  
  const roi = summary.investedValue > 0 
    ? ((summary.totalValue - summary.investedValue) / summary.investedValue) * 100 
    : 0

  return { roi, sharpeRatio, maxDrawdown }
}

export default function Portfolio() {
  const { t } = useLanguage()
  const { summary, holdings, loading, usingMock } = usePortfolio()

  const metrics = useMemo(() => {
    if (!holdings.length || !summary) return { roi: 0, sharpeRatio: 0, maxDrawdown: 0 }
    return calculateMetrics(holdings, summary)
  }, [holdings, summary])

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-500" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">{t('portfolio.title')}</h1>
          <p className="text-surface-500">{t('portfolio.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {usingMock && <Badge variant="warning">Demo Data</Badge>}
          <Badge variant="success" dot>Live</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2 overflow-hidden">
          <div className="p-6 bg-gradient-to-br from-primary-500/10 via-accent-500/5 to-transparent">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-surface-500 mb-1">Current Value</p>
                <p className="text-4xl font-bold text-surface-900">
                  {formatCurrency(summary.totalValue)}
                </p>
                <div className="flex items-center gap-4 mt-3">
                  <div className="flex items-center gap-1 text-success-600">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">{formatPercent(summary.todayChangePercent)}</span>
                    <span className="text-surface-500 text-sm">today</span>
                  </div>
                  <div className="h-4 w-px bg-surface-200" />
                  <div>
                    <span className="text-success-600 font-medium">
                      +{formatCurrency(summary.todayChange)}
                    </span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-surface-500">Invested</p>
                <p className="text-lg font-semibold text-surface-900">
                  {formatCurrency(summary.investedValue)}
                </p>
              </div>
            </div>
          </div>
          <div className="px-6 py-4 border-t border-surface-100 flex justify-between">
            <div>
              <p className="text-xs text-surface-500">Total Returns</p>
              <p className="text-lg font-semibold text-success-600">
                +{formatCurrency(summary.totalReturns)}
              </p>
            </div>
            <div>
              <p className="text-xs text-surface-500">Return Rate</p>
              <p className="text-lg font-semibold text-success-600">
                {formatPercent(summary.returnPercent)}
              </p>
            </div>
            <div>
              <p className="text-xs text-surface-500">Holdings</p>
              <p className="text-lg font-semibold text-surface-900">
                {holdings.length} stocks
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-surface-900 mb-4">{t('portfolio.performance')}</h3>
          <div className="space-y-4">
            <div className="p-4 bg-gradient-to-r from-primary-50 to-accent-50 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Target className="w-4 h-4 text-primary-600" />
                <span className="text-sm text-surface-600">ROI</span>
              </div>
              <p className={`text-2xl font-bold ${metrics.roi >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {metrics.roi >= 0 ? '+' : ''}{metrics.roi.toFixed(2)}%
              </p>
            </div>
            <div className="p-4 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <BarChart3 className="w-4 h-4 text-accent-600" />
                <span className="text-sm text-surface-600">Sharpe Ratio</span>
              </div>
              <p className="text-2xl font-bold text-surface-900">
                {metrics.sharpeRatio.toFixed(2)}
              </p>
              <p className="text-xs text-surface-500 mt-1">
                {metrics.sharpeRatio > 1 ? 'Excellent' : metrics.sharpeRatio > 0.5 ? 'Good' : 'Moderate'}
              </p>
            </div>
            <div className="p-4 bg-surface-50 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <AlertTriangle className="w-4 h-4 text-warning-600" />
                <span className="text-sm text-surface-600">Max Drawdown</span>
              </div>
              <p className={`text-2xl font-bold ${metrics.maxDrawdown > 20 ? 'text-danger-600' : 'text-warning-600'}`}>
                -{metrics.maxDrawdown.toFixed(2)}%
              </p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <div className="p-4 border-b border-surface-100">
          <h3 className="font-semibold text-surface-900">Holdings</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Shares</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Avg Cost</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-surface-500 uppercase">Trend</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Current</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Value</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Gain/Loss</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {holdings.map((holding) => {
                const isPositive = holding.gain >= 0
                const sparkData = generateSparklineData(20, isPositive ? 'up' : 'down')
                return (
                  <tr key={holding.symbol} className="hover:bg-surface-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-600">
                            {holding.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-surface-900">{holding.symbol}</p>
                          <p className="text-xs text-surface-500">{holding.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-surface-900">{holding.shares}</td>
                    <td className="px-6 py-4 text-right text-surface-500">{holding.avgCost.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <Sparkline data={sparkData} color="auto" width={80} height={24} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-surface-900">
                      {holding.currentPrice.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-surface-900">
                      {formatCurrency(holding.value)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={isPositive ? 'text-success-600' : 'text-danger-600'}>
                        <div className="flex items-center justify-end gap-1">
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span className="font-medium">{formatPercent(holding.gainPercent)}</span>
                        </div>
                        <p className="text-xs">
                          {isPositive ? '+' : ''}{formatCurrency(holding.gain)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-1.5 rounded-lg hover:bg-surface-100 transition-colors">
                        <MoreVertical className="w-4 h-4 text-surface-400" />
                      </button>
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
