export const STOCKS = [
  { symbol: 'BIAT', name: 'Banque Internationale Arabe de Tunisie', sector: 'Banking', price: 118.50, change: 2.34, changePercent: 2.01, volume: 45230, marketCap: 2847000000 },
  { symbol: 'BNA', name: 'Banque Nationale Agricole', sector: 'Banking', price: 12.80, change: -0.15, changePercent: -1.16, volume: 23100, marketCap: 512000000 },
  { symbol: 'SFBT', name: 'Société de Fabrication des Boissons de Tunisie', sector: 'Consumer', price: 21.40, change: 0.85, changePercent: 4.13, volume: 67800, marketCap: 1284000000 },
  { symbol: 'ATB', name: 'Arab Tunisian Bank', sector: 'Banking', price: 4.25, change: 0.12, changePercent: 2.91, volume: 89450, marketCap: 340000000 },
  { symbol: 'BH', name: 'Banque de l\'Habitat', sector: 'Banking', price: 15.60, change: -0.28, changePercent: -1.76, volume: 34200, marketCap: 624000000 },
  { symbol: 'UIB', name: 'Union Internationale de Banques', sector: 'Banking', price: 22.30, change: 1.05, changePercent: 4.94, volume: 52100, marketCap: 892000000 },
  { symbol: 'STAR', name: 'Société Tunisienne d\'Assurances et de Réassurances', sector: 'Insurance', price: 156.00, change: 3.20, changePercent: 2.09, volume: 12400, marketCap: 1560000000 },
  { symbol: 'TJARI', name: 'Tunisie Leasing & Factoring', sector: 'Financial Services', price: 8.90, change: 0.22, changePercent: 2.53, volume: 28700, marketCap: 178000000 },
  { symbol: 'SOTUVER', name: 'Société Tunisienne de Verreries', sector: 'Industrial', price: 7.15, change: -0.08, changePercent: -1.11, volume: 15600, marketCap: 143000000 },
  { symbol: 'POULINA', name: 'Poulina Group Holding', sector: 'Conglomerate', price: 13.25, change: 0.45, changePercent: 3.51, volume: 78900, marketCap: 795000000 },
  { symbol: 'ADWYA', name: 'Adwya', sector: 'Healthcare', price: 6.40, change: 0.18, changePercent: 2.89, volume: 41200, marketCap: 192000000 },
  { symbol: 'SAH', name: 'SAH Lilas', sector: 'Consumer', price: 18.70, change: -0.32, changePercent: -1.68, volume: 25800, marketCap: 561000000 },
]

export const MARKET_SUMMARY = {
  tunindex: { value: 9245.67, change: 45.23, changePercent: 0.49 },
  tunindex20: { value: 4123.45, change: 18.76, changePercent: 0.46 },
  volume: 4523000,
  trades: 2847,
  marketCap: 28470000000,
}

export const SECTORS = [
  { name: 'Banking', performance: 2.34, stocks: 6 },
  { name: 'Insurance', performance: 1.87, stocks: 4 },
  { name: 'Consumer', performance: 3.21, stocks: 5 },
  { name: 'Industrial', performance: -0.54, stocks: 8 },
  { name: 'Healthcare', performance: 1.45, stocks: 3 },
  { name: 'Financial Services', performance: 0.92, stocks: 4 },
]

export function generatePriceHistory(basePrice, days = 30) {
  const history = []
  let price = basePrice * 0.9
  const now = new Date()
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    const change = (Math.random() - 0.45) * (basePrice * 0.03)
    price = Math.max(price + change, basePrice * 0.7)
    history.push({
      date: date.toISOString().split('T')[0],
      price: parseFloat(price.toFixed(2)),
      volume: Math.floor(Math.random() * 100000) + 10000,
    })
  }
  
  return history
}

export function generateSparklineData(length = 20, trend = 'up') {
  const data = []
  let value = 50
  
  for (let i = 0; i < length; i++) {
    const trendBias = trend === 'up' ? 0.1 : trend === 'down' ? -0.1 : 0
    const change = (Math.random() - 0.5 + trendBias) * 10
    value = Math.max(10, Math.min(90, value + change))
    data.push(value)
  }
  
  return data
}

export function generateOHLCData(basePrice, days = 30) {
  const history = []
  let lastClose = basePrice * 0.9
  const now = new Date()
  
  for (let i = days; i >= 0; i--) {
    const date = new Date(now)
    date.setDate(date.getDate() - i)
    
    // Generate realistic OHLC data
    const volatility = basePrice * 0.025
    const dailyChange = (Math.random() - 0.45) * volatility
    
    const open = lastClose + (Math.random() - 0.5) * volatility * 0.3
    const close = lastClose + dailyChange
    const high = Math.max(open, close) + Math.random() * volatility * 0.5
    const low = Math.min(open, close) - Math.random() * volatility * 0.5
    const volume = Math.floor(Math.random() * 100000) + 10000
    
    lastClose = close
    
    history.push({
      date: date.toISOString().split('T')[0],
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      price: parseFloat(close.toFixed(2)), // For compatibility with line chart
      volume,
    })
  }
  
  return history
}
