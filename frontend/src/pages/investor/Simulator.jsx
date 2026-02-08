import { useState, useEffect } from 'react'
import { 
  Wallet, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Clock
} from 'lucide-react'
import { useLanguage } from '../../context/LanguageContext'
import { Card, Button } from '../../components/ui'
import { AgentChat } from '../../components/agent'
import { CandlestickChart } from '../../components/charts'
import { api } from '../../services/api'

const INITIAL_BALANCE = 100000 // 100,000 TND

// Demo stocks for simulation
const DEMO_STOCKS = [
  { code: 'BIAT', name: 'Banque Internationale Arabe de Tunisie', price: 112.50, change: 1.2 },
  { code: 'SFBT', name: 'Societe de Fabrication des Boissons', price: 22.80, change: -0.5 },
  { code: 'TLNET', name: 'Telnet Holding', price: 8.45, change: 2.3 },
  { code: 'PGH', name: 'Poulina Group Holding', price: 14.20, change: 0.8 },
  { code: 'UBCI', name: 'Union Bancaire Commerce Industrie', price: 32.00, change: -1.1 },
]

function Simulator() {
  const { t } = useLanguage()
  const [balance, setBalance] = useState(INITIAL_BALANCE)
  const [portfolio, setPortfolio] = useState({})
  const [trades, setTrades] = useState([])
  const [selectedStock, setSelectedStock] = useState(DEMO_STOCKS[0])
  const [quantity, setQuantity] = useState(10)
  const [chartData, setChartData] = useState([])

  // Generate demo chart data
  useEffect(() => {
    const data = []
    const basePrice = selectedStock.price
    let currentPrice = basePrice * 0.9

    for (let i = 30; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      
      const volatility = 0.02
      const change = (Math.random() - 0.5) * volatility * currentPrice
      const open = currentPrice
      currentPrice = Math.max(currentPrice + change, basePrice * 0.7)
      const close = currentPrice
      const high = Math.max(open, close) * (1 + Math.random() * 0.01)
      const low = Math.min(open, close) * (1 - Math.random() * 0.01)
      const volume = Math.floor(Math.random() * 50000) + 10000

      data.push({
        date: date.toISOString().split('T')[0],
        open: parseFloat(open.toFixed(2)),
        high: parseFloat(high.toFixed(2)),
        low: parseFloat(low.toFixed(2)),
        close: parseFloat(close.toFixed(2)),
        volume
      })
    }
    setChartData(data)
  }, [selectedStock])

  // Calculate portfolio value
  const portfolioValue = Object.entries(portfolio).reduce((total, [code, qty]) => {
    const stock = DEMO_STOCKS.find(s => s.code === code)
    return total + (stock ? stock.price * qty : 0)
  }, 0)

  const totalValue = balance + portfolioValue
  const profit = totalValue - INITIAL_BALANCE
  const profitPercent = ((profit / INITIAL_BALANCE) * 100).toFixed(2)

  const handleBuy = () => {
    const cost = selectedStock.price * quantity
    if (cost > balance) {
      alert('Solde insuffisant!')
      return
    }

    setBalance(prev => prev - cost)
    setPortfolio(prev => ({
      ...prev,
      [selectedStock.code]: (prev[selectedStock.code] || 0) + quantity
    }))
    setTrades(prev => [{
      type: 'buy',
      code: selectedStock.code,
      quantity,
      price: selectedStock.price,
      total: cost,
      date: new Date().toLocaleString('fr-FR')
    }, ...prev])
  }

  const handleSell = () => {
    const held = portfolio[selectedStock.code] || 0
    if (quantity > held) {
      alert('Quantite insuffisante!')
      return
    }

    const revenue = selectedStock.price * quantity
    setBalance(prev => prev + revenue)
    setPortfolio(prev => {
      const newQty = prev[selectedStock.code] - quantity
      if (newQty <= 0) {
        const { [selectedStock.code]: _, ...rest } = prev
        return rest
      }
      return { ...prev, [selectedStock.code]: newQty }
    })
    setTrades(prev => [{
      type: 'sell',
      code: selectedStock.code,
      quantity,
      price: selectedStock.price,
      total: revenue,
      date: new Date().toLocaleString('fr-FR')
    }, ...prev])
  }

  const handleReset = () => {
    if (confirm('Reinitialiser la simulation?')) {
      setBalance(INITIAL_BALANCE)
      setPortfolio({})
      setTrades([])
    }
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center">
              <Wallet className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">{t('simulator.virtualBalance')}</p>
              <p className="text-lg font-bold text-surface-900">{balance.toLocaleString('fr-FR')} TND</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent-100 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-accent-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">{t('simulator.currentValue')}</p>
              <p className="text-lg font-bold text-surface-900">{totalValue.toLocaleString('fr-FR')} TND</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              profit >= 0 ? 'bg-success-100' : 'bg-danger-100'
            }`}>
              {profit >= 0 
                ? <TrendingUp className="w-5 h-5 text-success-600" />
                : <TrendingDown className="w-5 h-5 text-danger-600" />
              }
            </div>
            <div>
              <p className="text-xs text-surface-500">{t('simulator.profit')}</p>
              <p className={`text-lg font-bold ${profit >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                {profit >= 0 ? '+' : ''}{profit.toLocaleString('fr-FR')} TND ({profitPercent}%)
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-warning-100 flex items-center justify-center">
              <Clock className="w-5 h-5 text-warning-600" />
            </div>
            <div>
              <p className="text-xs text-surface-500">{t('simulator.trades')}</p>
              <p className="text-lg font-bold text-surface-900">{trades.length}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trading Panel */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stock Selection & Chart */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-surface-900">{t('common.stocks')}</h3>
              <button
                onClick={handleReset}
                className="flex items-center gap-2 px-3 py-1.5 text-sm text-surface-600 hover:text-surface-900 hover:bg-surface-100 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {t('simulator.resetSimulation')}
              </button>
            </div>

            {/* Stock Pills */}
            <div className="flex flex-wrap gap-2 mb-6">
              {DEMO_STOCKS.map(stock => (
                <button
                  key={stock.code}
                  onClick={() => setSelectedStock(stock)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    selectedStock.code === stock.code
                      ? 'bg-primary-500 text-white'
                      : 'bg-surface-100 text-surface-700 hover:bg-surface-200'
                  }`}
                >
                  <span>{stock.code}</span>
                  <span className={`ml-2 ${stock.change >= 0 ? 'text-success-400' : 'text-danger-400'}`}>
                    {stock.change >= 0 ? '+' : ''}{stock.change}%
                  </span>
                </button>
              ))}
            </div>

            {/* Chart */}
            <div className="h-[350px]">
              <CandlestickChart data={chartData} height={320} />
            </div>
          </Card>

          {/* Buy/Sell Panel */}
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-surface-900">{selectedStock.code}</h3>
                <p className="text-sm text-surface-500">{selectedStock.name}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-surface-900">{selectedStock.price.toFixed(2)} TND</p>
                <p className={`text-sm ${selectedStock.change >= 0 ? 'text-success-600' : 'text-danger-600'}`}>
                  {selectedStock.change >= 0 ? '+' : ''}{selectedStock.change}%
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-surface-700 mb-1">
                  {t('simulator.quantity')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-4 py-2 border border-surface-200 rounded-xl focus:ring-2 focus:ring-primary-100 focus:border-primary-500 outline-none"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleBuy}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-success-500 text-white rounded-xl hover:bg-success-600 transition-colors"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {t('common.buy')} ({(selectedStock.price * quantity).toFixed(2)} TND)
                </button>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleSell}
                  disabled={!portfolio[selectedStock.code]}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-danger-500 text-white rounded-xl hover:bg-danger-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  {t('common.sell')}
                </button>
              </div>
            </div>

            {/* Portfolio Holdings */}
            {Object.keys(portfolio).length > 0 && (
              <div className="mt-6 pt-4 border-t border-surface-100">
                <h4 className="text-sm font-medium text-surface-700 mb-3">{t('portfolio.holdings')}</h4>
                <div className="space-y-2">
                  {Object.entries(portfolio).map(([code, qty]) => {
                    const stock = DEMO_STOCKS.find(s => s.code === code)
                    const value = stock ? stock.price * qty : 0
                    return (
                      <div key={code} className="flex items-center justify-between py-2 px-3 bg-surface-50 rounded-lg">
                        <span className="font-medium text-surface-900">{code}</span>
                        <span className="text-surface-600">{qty} actions</span>
                        <span className="font-medium text-surface-900">{value.toFixed(2)} TND</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </Card>

          {/* Trade History */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-surface-900 mb-4">{t('simulator.orderHistory')}</h3>
            {trades.length === 0 ? (
              <p className="text-center text-surface-500 py-8">{t('common.noData')}</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-surface-500 border-b border-surface-100">
                      <th className="pb-2">{t('common.date')}</th>
                      <th className="pb-2">Type</th>
                      <th className="pb-2">{t('common.stock')}</th>
                      <th className="pb-2">{t('simulator.quantity')}</th>
                      <th className="pb-2">{t('common.price')}</th>
                      <th className="pb-2">{t('common.total')}</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {trades.slice(0, 10).map((trade, index) => (
                      <tr key={index} className="border-b border-surface-50">
                        <td className="py-3 text-surface-600">{trade.date}</td>
                        <td className="py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            trade.type === 'buy' 
                              ? 'bg-success-100 text-success-700' 
                              : 'bg-danger-100 text-danger-700'
                          }`}>
                            {trade.type === 'buy' ? t('common.buy') : t('common.sell')}
                          </span>
                        </td>
                        <td className="py-3 font-medium text-surface-900">{trade.code}</td>
                        <td className="py-3 text-surface-600">{trade.quantity}</td>
                        <td className="py-3 text-surface-600">{trade.price.toFixed(2)} TND</td>
                        <td className="py-3 font-medium text-surface-900">{trade.total.toFixed(2)} TND</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Card>
        </div>

        {/* AI Assistant */}
        <div className="lg:col-span-1">
          <AgentChat stockCode={selectedStock.code} className="sticky top-6" />
        </div>
      </div>
    </div>
  )
}

export default Simulator
