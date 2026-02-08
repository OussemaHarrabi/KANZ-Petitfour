export const PORTFOLIO = {
  totalValue: 285437.50,
  investedValue: 245000.00,
  totalReturns: 40437.50,
  returnPercent: 16.51,
  todayChange: 1245.30,
  todayChangePercent: 0.44,
}

export const HOLDINGS = [
  { symbol: 'BIAT', name: 'Banque Internationale Arabe de Tunisie', shares: 500, avgCost: 105.20, currentPrice: 118.50, value: 59250.00, gain: 6650.00, gainPercent: 12.64 },
  { symbol: 'SFBT', name: 'SFBT', shares: 1200, avgCost: 18.50, currentPrice: 21.40, value: 25680.00, gain: 3480.00, gainPercent: 15.68 },
  { symbol: 'STAR', name: 'STAR Assurances', shares: 200, avgCost: 142.00, currentPrice: 156.00, value: 31200.00, gain: 2800.00, gainPercent: 9.86 },
  { symbol: 'UIB', name: 'Union Internationale de Banques', shares: 800, avgCost: 19.80, currentPrice: 22.30, value: 17840.00, gain: 2000.00, gainPercent: 12.63 },
  { symbol: 'POULINA', name: 'Poulina Group Holding', shares: 2000, avgCost: 11.50, currentPrice: 13.25, value: 26500.00, gain: 3500.00, gainPercent: 15.22 },
  { symbol: 'ATB', name: 'Arab Tunisian Bank', shares: 5000, avgCost: 3.90, currentPrice: 4.25, value: 21250.00, gain: 1750.00, gainPercent: 8.97 },
  { symbol: 'BH', name: 'Banque de l\'Habitat', shares: 1500, avgCost: 16.20, currentPrice: 15.60, value: 23400.00, gain: -900.00, gainPercent: -3.70 },
  { symbol: 'ADWYA', name: 'Adwya', shares: 3000, avgCost: 5.80, currentPrice: 6.40, value: 19200.00, gain: 1800.00, gainPercent: 10.34 },
]

export const WATCHLIST = [
  { symbol: 'BNA', name: 'Banque Nationale Agricole', price: 12.80, change: -0.15, changePercent: -1.16, alert: null },
  { symbol: 'SAH', name: 'SAH Lilas', price: 18.70, change: -0.32, changePercent: -1.68, alert: { type: 'below', target: 18.00 } },
  { symbol: 'SOTUVER', name: 'Société Tunisienne de Verreries', price: 7.15, change: -0.08, changePercent: -1.11, alert: null },
  { symbol: 'TJARI', name: 'Tunisie Leasing & Factoring', price: 8.90, change: 0.22, changePercent: 2.53, alert: { type: 'above', target: 9.50 } },
]

export const ALERTS = [
  { id: 1, type: 'price_target', symbol: 'BIAT', message: 'BIAT reached your target of 118.00 TND', timestamp: '2025-02-08T10:30:00', read: false },
  { id: 2, type: 'volume_spike', symbol: 'SFBT', message: 'Unusual volume detected on SFBT (+245%)', timestamp: '2025-02-08T09:15:00', read: false },
  { id: 3, type: 'recommendation', symbol: 'UIB', message: 'AI recommends: Strong Buy for UIB', timestamp: '2025-02-07T16:45:00', read: true },
  { id: 4, type: 'portfolio', symbol: null, message: 'Your portfolio is up 0.44% today', timestamp: '2025-02-08T08:00:00', read: true },
  { id: 5, type: 'price_drop', symbol: 'BH', message: 'BH dropped 1.76% - below your alert threshold', timestamp: '2025-02-07T14:20:00', read: true },
]
