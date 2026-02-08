import { useState, useEffect, useCallback } from 'react'
import { api } from './api'
import { STOCKS, MARKET_SUMMARY } from '../data/stocks'
import { PORTFOLIO, HOLDINGS } from '../data/portfolio'

export function useApi(fetchFn, deps = [], immediate = true) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(immediate)
  const [error, setError] = useState(null)

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)
    try {
      const result = await fetchFn(...args)
      setData(result)
      return result
    } catch (err) {
      setError(err.message || 'An error occurred')
      throw err
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    if (immediate) {
      execute().catch(() => {})
    }
  }, [execute, immediate])

  return { data, loading, error, refetch: execute }
}

export function useApiLazy(fetchFn) {
  return useApi(fetchFn, [], false)
}

export function useStocks() {
  const [stocks, setStocks] = useState(STOCKS)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [usingMock, setUsingMock] = useState(false)

  useEffect(() => {
    async function fetchStocks() {
      try {
        const apiStocks = await api.stocks.list()
        const transformed = apiStocks.map(s => ({
          symbol: s.code,
          name: s.name,
          sector: 'BVMT',
          price: s.latest_price || 0,
          change: (s.latest_price || 0) * (s.change_pct || 0) / 100,
          changePercent: s.change_pct || 0,
          volume: 0,
          marketCap: 0,
          lastDate: s.last_date,
        }))
        setStocks(transformed.length > 0 ? transformed : STOCKS)
        setUsingMock(transformed.length === 0)
      } catch (err) {
        setError(err.message)
        setUsingMock(true)
      } finally {
        setLoading(false)
      }
    }
    fetchStocks()
  }, [])

  return { stocks, loading, error, usingMock }
}

export function useMarketOverview() {
  const [data, setData] = useState(MARKET_SUMMARY)
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)

  useEffect(() => {
    async function fetchMarket() {
      try {
        const overview = await api.market.overview()
        setData({
          tunindex: { 
            value: overview.value, 
            change: overview.change_pct * 10, 
            changePercent: overview.change_pct 
          },
          tunindex20: { 
            value: overview.value * 0.45, 
            change: overview.change_pct * 5, 
            changePercent: overview.change_pct * 0.95 
          },
          volume: 0,
          trades: 0,
          marketCap: 0,
          topGainers: overview.top_gainers,
          topLosers: overview.top_losers,
        })
      } catch (err) {
        setUsingMock(true)
      } finally {
        setLoading(false)
      }
    }
    fetchMarket()
  }, [])

  return { data, loading, usingMock }
}

export function useStockPrediction(code) {
  const [prediction, setPrediction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!code) return
    
    async function fetchPrediction() {
      try {
        const data = await api.stocks.prediction(code)
        setPrediction(data)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    fetchPrediction()
  }, [code])

  return { prediction, loading, error }
}

export function usePortfolio() {
  const [portfolio, setPortfolio] = useState({ summary: PORTFOLIO, holdings: HOLDINGS })
  const [loading, setLoading] = useState(true)
  const [usingMock, setUsingMock] = useState(false)

  useEffect(() => {
    async function fetchPortfolio() {
      try {
        const positions = await api.portfolio.list()
        if (positions && positions.length > 0) {
          const holdings = positions.map(p => ({
            symbol: p.stock_code,
            name: p.stock_code,
            shares: p.quantity,
            avgCost: p.avg_buy_price,
            currentPrice: p.current_price || p.avg_buy_price,
            value: p.current_value || (p.quantity * p.avg_buy_price),
            gain: (p.current_price - p.avg_buy_price) * p.quantity,
            gainPercent: ((p.current_price - p.avg_buy_price) / p.avg_buy_price) * 100,
          }))
          const totalValue = holdings.reduce((sum, h) => sum + h.value, 0)
          const totalInvested = holdings.reduce((sum, h) => sum + (h.shares * h.avgCost), 0)
          setPortfolio({
            summary: {
              totalValue,
              investedValue: totalInvested,
              todayChange: totalValue * 0.01,
              todayChangePercent: 1.0,
              totalReturns: totalValue - totalInvested,
              returnPercent: ((totalValue - totalInvested) / totalInvested) * 100,
            },
            holdings,
          })
        } else {
          setUsingMock(true)
        }
      } catch (err) {
        setUsingMock(true)
      } finally {
        setLoading(false)
      }
    }
    fetchPortfolio()
  }, [])

  return { ...portfolio, loading, usingMock }
}

export function useAlerts() {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAlerts() {
      try {
        const data = await api.alerts.list()
        setAlerts(data)
      } catch (err) {
        setAlerts([])
      } finally {
        setLoading(false)
      }
    }
    fetchAlerts()
  }, [])

  return { alerts, loading }
}
