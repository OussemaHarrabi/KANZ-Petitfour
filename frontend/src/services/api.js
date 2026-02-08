const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  }

  const response = await fetch(url, config)
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: 'Request failed' }))
    throw new Error(error.detail || `HTTP ${response.status}`)
  }

  return response.json()
}

export const api = {
  health: () => request('/health'),

  market: {
    overview: () => request('/api/market/overview'),
    topMovers: () => request('/api/market/top-movers'),
    sentiment: () => request('/api/market/sentiment'),
    live: () => request('/api/market/live'),
    liveQuote: (stockCode) => request(`/api/market/live/quote/${stockCode}`),
    liveTunindex: () => request('/api/market/live/tunindex'),
    liveMovers: (limit = 10) => request(`/api/market/live/movers?limit=${limit}`),
  },

  stocks: {
    list: () => request('/api/stocks'),
    detail: (code) => request(`/api/stocks/${code}`),
    history: (code, days = 30) => request(`/api/stocks/${code}/history?days=${days}`),
    prediction: (code) => request(`/api/stocks/${code}/prediction`),
    sentiment: (code) => request(`/api/stocks/${code}/sentiment`),
    recommendation: (code) => request(`/api/stocks/${code}/recommendation`),
    anomaly: (code) => request(`/api/stocks/${code}/anomaly`),
  },

  news: {
    list: (params = {}) => {
      const query = new URLSearchParams()
      if (params.limit) query.set('limit', params.limit)
      if (params.stockCode) query.set('stock_code', params.stockCode)
      if (params.source) query.set('source', params.source)
      if (params.language) query.set('language', params.language)
      if (params.days) query.set('days', params.days)
      const qs = query.toString()
      return request(`/api/news${qs ? '?' + qs : ''}`)
    },
    forStock: (stockCode, limit = 10) => request(`/api/news/stock/${stockCode}?limit=${limit}`),
    stockSentiment: (stockCode, days = 7) => request(`/api/news/sentiment/${stockCode}?days=${days}`),
    marketSentiment: (days = 7) => request(`/api/news/market-sentiment?days=${days}`),
    analyzeText: (text) => request(`/api/news/analyze?text=${encodeURIComponent(text)}`),
  },

  portfolio: {
    list: () => request('/api/portfolio'),
    buy: (stockCode, quantity, price) => 
      request('/api/portfolio/buy', {
        method: 'POST',
        body: JSON.stringify({ stock_code: stockCode, quantity, price }),
      }),
    sell: (stockCode, quantity, price) =>
      request('/api/portfolio/sell', {
        method: 'POST',
        body: JSON.stringify({ stock_code: stockCode, quantity, price }),
      }),
  },

  alerts: {
    list: () => request('/api/alerts'),
    unread: () => request('/api/alerts/unread'),
    markRead: (alertId) => request(`/api/alerts/${alertId}/read`, { method: 'POST' }),
  },

  agent: {
    chat: (message, stockCode = null) => request('/api/agent/chat', {
      method: 'POST',
      body: JSON.stringify({ message, stock_code: stockCode }),
    }),
    advice: (stockCode) => request(`/api/agent/advice/${stockCode}`),
  },

  profile: {
    get: () => request('/api/profile'),
    analyze: (data) => request('/api/profile/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  },

  scheduler: {
    status: () => request('/api/scheduler/status'),
  },
}

export default api
