import { useState, useMemo } from 'react'
import { Search, TrendingUp, TrendingDown, ArrowUpRight, Loader2, Flame, Trophy } from 'lucide-react'
import { Card, Badge, Input } from '../../components/ui'
import { Sparkline } from '../../components/charts'
import { formatCurrency, formatPercent, formatNumber } from '../../lib/utils'
import { useStocks, useMarketOverview } from '../../services'
import { generateSparklineData } from '../../data/stocks'
import { useLanguage } from '../../context/LanguageContext'

export default function Market() {
  const { t } = useLanguage()
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedSector, setSelectedSector] = useState('all')
  
  const { stocks, loading: stocksLoading, usingMock: stocksMock } = useStocks()
  const { data: marketData, loading: marketLoading, usingMock: marketMock } = useMarketOverview()

  // Calculate top gainers and losers
  const { topGainers, topLosers } = useMemo(() => {
    const sorted = [...stocks].sort((a, b) => b.changePercent - a.changePercent)
    return {
      topGainers: sorted.slice(0, 5),
      topLosers: sorted.slice(-5).reverse()
    }
  }, [stocks])

  const filteredStocks = stocks.filter((stock) => {
    const matchesSearch = stock.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      stock.name.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesSector = selectedSector === 'all' || stock.sector === selectedSector
    return matchesSearch && matchesSector
  })

  const sectors = ['all', ...new Set(stocks.map(s => s.sector))]

  if (stocksLoading || marketLoading) {
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
          <h1 className="text-2xl font-bold text-surface-900">{t('market.title')}</h1>
          <p className="text-surface-500">{t('market.subtitle')}</p>
        </div>
        <div className="flex items-center gap-2">
          {(stocksMock || marketMock) && (
            <Badge variant="warning">Demo Data</Badge>
          )}
          <Badge variant="success" dot>Market Open</Badge>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <p className="text-xs text-surface-500 uppercase font-medium">TUNINDEX</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">
            {formatNumber(marketData.tunindex.value)}
          </p>
          <div className={`flex items-center gap-1 mt-1 ${marketData.tunindex.change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
            {marketData.tunindex.change >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
            <span className="text-sm font-medium">{formatPercent(marketData.tunindex.changePercent)}</span>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-surface-500 uppercase font-medium">TUNINDEX 20</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">
            {formatNumber(marketData.tunindex20.value)}
          </p>
          <div className="flex items-center gap-1 mt-1 text-success-600">
            <TrendingUp className="w-3 h-3" />
            <span className="text-sm font-medium">{formatPercent(marketData.tunindex20.changePercent)}</span>
          </div>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-surface-500 uppercase font-medium">{t('common.volume')}</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">
            {formatNumber(marketData.volume)}
          </p>
          <p className="text-sm text-surface-500 mt-1">shares traded</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-surface-500 uppercase font-medium">Trades</p>
          <p className="text-2xl font-bold text-surface-900 mt-1">
            {formatNumber(marketData.trades)}
          </p>
          <p className="text-sm text-surface-500 mt-1">transactions</p>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-success-600" />
            <h3 className="font-semibold text-surface-900">{t('market.topGainers')}</h3>
          </div>
          <div className="space-y-3">
            {topGainers.map((stock, idx) => (
              <div key={stock.symbol} className="flex items-center justify-between p-3 bg-success-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-success-100 flex items-center justify-center text-xs font-bold text-success-700">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-surface-900">{stock.symbol}</p>
                    <p className="text-xs text-surface-500 truncate max-w-[120px]">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-surface-900">{stock.price.toFixed(2)} TND</p>
                  <div className="flex items-center justify-end gap-1 text-success-600">
                    <TrendingUp className="w-3 h-3" />
                    <span className="text-sm font-medium">{formatPercent(stock.changePercent)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-2 mb-4">
            <Flame className="w-5 h-5 text-danger-600" />
            <h3 className="font-semibold text-surface-900">{t('market.topLosers')}</h3>
          </div>
          <div className="space-y-3">
            {topLosers.map((stock, idx) => (
              <div key={stock.symbol} className="flex items-center justify-between p-3 bg-danger-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-danger-100 flex items-center justify-center text-xs font-bold text-danger-700">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-medium text-surface-900">{stock.symbol}</p>
                    <p className="text-xs text-surface-500 truncate max-w-[120px]">{stock.name}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-surface-900">{stock.price.toFixed(2)} TND</p>
                  <div className="flex items-center justify-end gap-1 text-danger-600">
                    <TrendingDown className="w-3 h-3" />
                    <span className="text-sm font-medium">{formatPercent(stock.changePercent)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input 
            placeholder="Search stocks..." 
            icon={Search}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sectors.map((sector) => (
            <button
              key={sector}
              onClick={() => setSelectedSector(sector)}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
                selectedSector === sector
                  ? 'bg-primary-500 text-white shadow-md'
                  : 'bg-white border border-surface-200 text-surface-600 hover:border-primary-300'
              }`}
            >
              {sector === 'all' ? 'All Sectors' : sector}
            </button>
          ))}
        </div>
      </div>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-surface-100">
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-surface-500 uppercase">Sector</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-surface-500 uppercase">Chart</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Price</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Change</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-surface-500 uppercase">Volume</th>
                <th className="px-6 py-3"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-100">
              {filteredStocks.map((stock) => {
                const isPositive = stock.change >= 0
                const sparkData = generateSparklineData(20, isPositive ? 'up' : 'down')
                return (
                  <tr key={stock.symbol} className="hover:bg-surface-50 transition-colors cursor-pointer">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary-600">
                            {stock.symbol.slice(0, 2)}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-surface-900">{stock.symbol}</p>
                          <p className="text-xs text-surface-500 truncate max-w-[200px]">{stock.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="default">{stock.sector}</Badge>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-center">
                        <Sparkline data={sparkData} color="auto" width={100} height={28} />
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <p className="font-semibold text-surface-900">{stock.price.toFixed(2)}</p>
                      <p className="text-xs text-surface-500">TND</p>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className={isPositive ? 'text-success-600' : 'text-danger-600'}>
                        <div className="flex items-center justify-end gap-1">
                          {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                          <span className="font-medium">{formatPercent(stock.changePercent)}</span>
                        </div>
                        <p className="text-xs">
                          {isPositive ? '+' : ''}{stock.change.toFixed(2)}
                        </p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-surface-600">
                      {formatNumber(stock.volume)}
                    </td>
                    <td className="px-6 py-4">
                      <button className="p-2 rounded-lg hover:bg-primary-50 text-primary-600 transition-colors">
                        <ArrowUpRight className="w-4 h-4" />
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
