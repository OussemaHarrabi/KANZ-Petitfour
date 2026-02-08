import { Star, TrendingUp, TrendingDown, Plus, Bell, Trash2 } from 'lucide-react'
import { Card, Badge, Button } from '../../components/ui'
import { Sparkline } from '../../components/charts'
import { formatPercent } from '../../lib/utils'
import { WATCHLIST } from '../../data/portfolio'
import { generateSparklineData } from '../../data/stocks'

export default function Watchlist() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-surface-900">Watchlist</h1>
          <p className="text-surface-500">Track your favorite stocks</p>
        </div>
        <Button>
          <Plus className="w-4 h-4" />
          Add Stock
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {WATCHLIST.map((stock) => {
          const isPositive = stock.change >= 0
          const sparkData = generateSparklineData(20, isPositive ? 'up' : 'down')
          return (
            <Card key={stock.symbol} hover className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                    <span className="text-sm font-bold text-primary-600">
                      {stock.symbol.slice(0, 2)}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-surface-900">{stock.symbol}</p>
                    <p className="text-xs text-surface-500">{stock.name}</p>
                  </div>
                </div>
                <button className="p-1.5 rounded-lg hover:bg-surface-100 text-warning-500">
                  <Star className="w-4 h-4 fill-current" />
                </button>
              </div>

              <div className="mb-4">
                <Sparkline data={sparkData} color="auto" width={200} height={40} />
              </div>

              <div className="flex items-end justify-between">
                <div>
                  <p className="text-2xl font-bold text-surface-900">
                    {stock.price.toFixed(2)}
                  </p>
                  <div className={`flex items-center gap-1 ${isPositive ? 'text-success-600' : 'text-danger-600'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span className="text-sm font-medium">{formatPercent(stock.changePercent)}</span>
                  </div>
                </div>
                {stock.alert && (
                  <Badge variant={stock.alert.type === 'above' ? 'success' : 'danger'} size="sm">
                    <Bell className="w-3 h-3" />
                    {stock.alert.target.toFixed(2)}
                  </Badge>
                )}
              </div>

              <div className="flex gap-2 mt-4 pt-4 border-t border-surface-100">
                <Button variant="secondary" size="sm" className="flex-1">
                  <Bell className="w-3 h-3" />
                  Alert
                </Button>
                <Button variant="ghost" size="sm">
                  <Trash2 className="w-3 h-3 text-danger-500" />
                </Button>
              </div>
            </Card>
          )
        })}

        <Card className="p-6 border-dashed border-2 flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50/50 transition-all">
          <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mb-3">
            <Plus className="w-6 h-6 text-surface-400" />
          </div>
          <p className="font-medium text-surface-600">Add to Watchlist</p>
          <p className="text-sm text-surface-400">Track a new stock</p>
        </Card>
      </div>
    </div>
  )
}
