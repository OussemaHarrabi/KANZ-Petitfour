# KANZ Frontend

React-based frontend for the KANZ trading assistant platform.

## Architecture

```
frontend/src/
├── pages/
│   ├── investor/           # Investor dashboard
│   │   ├── Market.jsx      # Market overview
│   │   ├── Analysis.jsx    # Stock analysis with predictions
│   │   ├── Portfolio.jsx   # Portfolio management
│   │   ├── Alerts.jsx      # Alert notifications
│   │   ├── Watchlist.jsx   # Stock watchlist
│   │   ├── Simulator.jsx   # Virtual trading
│   │   └── Profile.jsx     # Investor profile
│   │
│   ├── inspector/          # CMF Inspector dashboard
│   │   ├── Dashboard.jsx   # Overview
│   │   ├── Anomalies.jsx   # Anomaly feed
│   │   ├── Investigations.jsx
│   │   ├── Monitoring.jsx
│   │   ├── DeepDive.jsx
│   │   └── Reports.jsx
│   │
│   └── RoleSelect.jsx      # Landing page
│
├── components/
│   ├── layout/             # InvestorLayout, InspectorLayout
│   └── ui/                 # Button, Card, Input
│
├── services/
│   ├── api.js              # Axios API client
│   └── useApi.js           # React hooks
│
├── context/
│   └── LanguageContext.jsx # i18n (French/Arabic)
│
├── i18n/                   # Translations
│   ├── fr.json
│   └── ar.json
│
└── data/                   # Static data
    ├── stocks.js
    ├── portfolio.js
    └── anomalies.js
```

## Routes

| Route | Page | Description |
|-------|------|-------------|
| `/` | RoleSelect | Choose Investor or Inspector |
| `/investor` | Portfolio | Investor dashboard home |
| `/investor/market` | Market | Market overview |
| `/investor/analysis` | Analysis | Stock analysis |
| `/investor/alerts` | Alerts | Alert notifications |
| `/investor/watchlist` | Watchlist | Saved stocks |
| `/investor/simulator` | Simulator | Virtual trading |
| `/investor/profile` | Profile | Risk profile |
| `/inspector` | Dashboard | Inspector home |
| `/inspector/anomalies` | Anomalies | Anomaly feed |
| `/inspector/investigations` | Investigations | Case management |
| `/inspector/monitoring` | Monitoring | Live surveillance |
| `/inspector/deep-dive` | DeepDive | Detailed analysis |
| `/inspector/reports` | Reports | Generate reports |

## Quick Start

```bash
npm install
npm run dev
```

Runs at http://localhost:5173

## API Integration

```javascript
import { stocksAPI, marketAPI, portfolioAPI } from './services/api'

// Get stock prediction
const prediction = await stocksAPI.getPrediction('SFBT')

// Get market overview
const market = await marketAPI.getOverview()

// Execute trade
await portfolioAPI.buy({ stock_code: 'SFBT', quantity: 100 })
```

## Theme

Dark theme with red accent (La Casa de Papel inspired):
- Background: `#0a0f1c`, `#111827`
- Accent: Red gradient `#dc2626`
- Text: White/gray

## Dependencies

- `react` + `react-router-dom` - UI & routing
- `recharts` - Charts
- `axios` - HTTP client
- `tailwindcss` - Styling
- `lucide-react` - Icons
- `@supabase/supabase-js` - Auth
