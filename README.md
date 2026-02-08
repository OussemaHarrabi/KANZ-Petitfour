# KANZ - AI-Powered Trading Assistant for Tunisia

<div align="center">
  <img src="https://img.shields.io/badge/IHEC--CODELAB-2.0-red?style=for-the-badge" alt="IHEC CODELAB 2.0" />
  <img src="https://img.shields.io/badge/FastAPI-Backend-009688?style=for-the-badge&logo=fastapi" alt="FastAPI" />
  <img src="https://img.shields.io/badge/React-Frontend-61DAFB?style=for-the-badge&logo=react" alt="React" />
  <img src="https://img.shields.io/badge/XGBoost-ML-FF6600?style=for-the-badge" alt="XGBoost" />
</div>

<br />

<div align="center">
  <h3>Empowering Tunisian Youth to Invest with Confidence</h3>
  <p>KANZ transforms the way young Tunisians approach investing by combining AI-powered insights with gamification, making the stock market accessible, understandable, and less intimidating.</p>
</div>

---

## The Problem We're Solving

### The Fear of Investing

Tunisia has one of the lowest retail investor participation rates in the MENA region. Young Tunisians, despite having savings, avoid the stock market due to:

- **Fear of Loss**: Complex financial jargon and unpredictable markets create anxiety
- **Lack of Guidance**: No accessible tools to help beginners understand when to buy/sell
- **Information Overload**: News in multiple languages (French/Arabic) with no clear signal
- **Trust Issues**: Concerns about market manipulation and unfair practices

### Our Solution: KANZ

KANZ (Arabic for "treasure") is an AI-powered trading assistant that:

1. **Reduces Fear** → Clear, explainable AI recommendations with confidence scores
2. **Guides Decisions** → Step-by-step investment journey with gamification elements
3. **Filters Noise** → Automated sentiment analysis of French/Arabic news sources
4. **Builds Trust** → Anomaly detection protects investors from market manipulation

---

## Platform Overview

### For Investors (Young Tunisians)

| Feature | Description |
|---------|-------------|
| **AI Price Predictions** | 5-day price forecasts using XGBoost models trained on BVMT data |
| **Smart Recommendations** | BUY/SELL/HOLD signals with plain-language explanations |
| **Sentiment Dashboard** | Real-time analysis of Tunisian financial news |
| **Portfolio Simulator** | Practice investing with virtual money before risking real funds |
| **Alert System** | Get notified of unusual market activity or price targets |
| **Investor Profile** | Personalized suggestions based on risk tolerance |

### For CMF Inspectors (Market Regulators)

| Feature | Description |
|---------|-------------|
| **Anomaly Detection** | ML-powered identification of suspicious trading patterns |
| **Investigation Tools** | Deep-dive analysis with timeline and correlation views |
| **Real-time Monitoring** | Live market surveillance dashboard |
| **Compliance Reports** | Automated generation of regulatory reports |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              KANZ PLATFORM                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                     FRONTEND (React + Vite)                          │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │   │
│  │  │   Market    │ │   Stock     │ │  Portfolio  │ │   Alerts    │    │   │
│  │  │  Overview   │ │  Analysis   │ │  Simulator  │ │  Dashboard  │    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘ └─────────────┘    │   │
│  │                    TailwindCSS + Recharts                            │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│                                    ▼ REST API                                │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │                      BACKEND (FastAPI)                               │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                    API ROUTES                                │    │   │
│  │  │  /stocks  /market  /portfolio  /alerts  /agent  /news       │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │                  ML SERVICES LAYER                          │    │   │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │    │   │
│  │  │  │Prediction│ │ Anomaly  │ │Sentiment │ │ Decision │       │    │   │
│  │  │  │ Service  │ │ Service  │ │ Service  │ │  Agent   │       │    │   │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  │  ┌─────────────────────────────────────────────────────────────┐    │   │
│  │  │              LangGraph AI Agent + RAG                       │    │   │
│  │  │         (Chat interface with CMF regulation knowledge)      │    │   │
│  │  └─────────────────────────────────────────────────────────────┘    │   │
│  └──────────────────────────────────────────────────────────────────────┘   │
│                                    │                                         │
│          ┌─────────────────────────┼─────────────────────────┐              │
│          ▼                         ▼                         ▼              │
│  ┌──────────────┐         ┌──────────────┐         ┌──────────────┐        │
│  │   ML MODELS  │         │   DATABASE   │         │  NLP ENGINE  │        │
│  │  (XGBoost)   │         │  (SQLite/    │         │ (Sentiment)  │        │
│  │              │         │   Supabase)  │         │              │        │
│  │ • 1-5 day    │         │              │         │ • News       │        │
│  │   predictions│         │ • Stocks     │         │   scrapers   │        │
│  │ • Anomaly    │         │ • Prices     │         │ • French/    │        │
│  │   detection  │         │ • Portfolio  │         │   Arabic NLP │        │
│  │              │         │ • Alerts     │         │              │        │
│  └──────────────┘         └──────────────┘         └──────────────┘        │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow

### Prediction Pipeline

```
Historical Data (2016-2025) → Feature Engineering (51 features) → XGBoost Models → 5-Day Forecast
                                       │
                                       ▼
                              ┌─────────────────┐
                              │ Technical       │
                              │ Indicators:     │
                              │ • RSI, MACD     │
                              │ • Bollinger     │
                              │ • Volatility    │
                              │ • Volume ratios │
                              └─────────────────┘
```

### Decision Agent Pipeline

```
┌─────────────┐   ┌─────────────┐   ┌─────────────┐
│ Price       │   │ Sentiment   │   │ Anomaly     │
│ Prediction  │   │ Analysis    │   │ Detection   │
│ (+2.5%)     │   │ (Positive)  │   │ (None)      │
└──────┬──────┘   └──────┬──────┘   └──────┬──────┘
       │                 │                 │
       └────────────────┬┴─────────────────┘
                        ▼
              ┌─────────────────────┐
              │   Decision Agent    │
              │   ┌─────────────┐   │
              │   │ User Profile│   │
              │   │ (Moderate)  │   │
              │   └─────────────┘   │
              └──────────┬──────────┘
                         ▼
              ┌─────────────────────┐
              │ RECOMMENDATION      │
              │ ─────────────────   │
              │ Action: BUY         │
              │ Confidence: 78%     │
              │                     │
              │ Reasons:            │
              │ • AI predicts +2.5% │
              │ • Positive news     │
              │ • No anomalies      │
              └─────────────────────┘
```

---

## Example Usage

### Scenario: Ahmed, 28-year-old beginner investor

```
1. Ahmed opens KANZ → Completes risk profile quiz → "Moderate" profile

2. Dashboard shows:
   ┌────────────────────────────────────────────┐
   │ TUNINDEX: 9,245.32 (+0.8%)                 │
   │ Market Sentiment: Slightly Bullish 📈       │
   │ Alerts: 2 new                              │
   └────────────────────────────────────────────┘

3. Ahmed clicks "SFBT" stock:
   ┌────────────────────────────────────────────┐
   │ Current: 12.450 TND                        │
   │ 5-Day Prediction: +2.1%                    │
   │ Sentiment: Positive (0.72)                 │
   │                                            │
   │ ┌──────────────────────────────────────┐   │
   │ │         RECOMMENDATION               │   │
   │ │            BUY ✓                     │   │
   │ │        Confidence: 74%               │   │
   │ └──────────────────────────────────────┘   │
   │                                            │
   │ Why?                                       │
   │ • AI predicts +2.1% in next 5 days        │
   │ • Recent positive news about new contract │
   │ • RSI at 42 (not overbought)              │
   │ • No suspicious activity detected         │
   └────────────────────────────────────────────┘

4. Ahmed buys 100 shares → Portfolio updated in real-time

5. Next day: Alert! "Volume spike on SAH (+400%)"
   Ahmed checks → News found → Legitimate announcement
```

---

## Hackathon Requirements Coverage

| Requirement | Module | Status | Implementation |
|-------------|--------|--------|----------------|
| **Price Prediction (1-5 days)** | ML | ✅ | XGBoost with 51 engineered features |
| **Liquidity Anticipation** | ML | ✅ | Volume ratio and transaction analysis |
| **Entry/Exit Timing** | Decision Agent | ✅ | Combined signals with confidence scores |
| **News Scraping (3+ sources)** | NLP | ✅ | WebManager, BusinessNews, Ilboursa, RadioExpress |
| **Sentiment Classification** | NLP | ✅ | Multilingual BERT + rule-based fallback |
| **Daily Sentiment Score** | NLP | ✅ | Aggregated per-stock sentiment |
| **Volume Spike Detection** | Anomaly | ✅ | Z-score > 3σ threshold |
| **Price Anomaly Detection** | Anomaly | ✅ | >5% moves without news |
| **Suspicious Pattern Detection** | Anomaly | ✅ | Isolation Forest ML model |
| **Alert System** | Backend | ✅ | Real-time notifications |
| **User Profiling** | Backend | ✅ | Conservative/Moderate/Aggressive |
| **Portfolio Simulation** | Frontend | ✅ | Virtual trading with P&L tracking |
| **Explainable Recommendations** | Agent | ✅ | Natural language justifications |
| **Market Overview Page** | Frontend | ✅ | TUNINDEX, top movers, sentiment |
| **Stock Analysis Page** | Frontend | ✅ | Charts, predictions, indicators |
| **Portfolio Page** | Frontend | ✅ | Holdings, performance, allocation |
| **Alerts Dashboard** | Frontend | ✅ | Real-time feed with filters |
| **CMF Inspector View** | Frontend | ✅ | Dedicated surveillance dashboard |
| **French/Arabic Support** | NLP | ✅ | Multilingual sentiment analysis |

---

## Quick Start

### Prerequisites

- Python 3.10+
- Node.js 18+
- Git

### Installation

```bash
# Clone the repository
git clone https://github.com/OussemaHarrabi/KANZ-Petitfour.git
cd KANZ-Petitfour

# Backend setup
cd backend
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt

# Frontend setup
cd ../frontend
npm install
```

### Running the Application

```bash
# Terminal 1: Start backend
cd backend
python run.py
# Backend runs at http://localhost:8000

# Terminal 2: Start frontend
cd frontend
npm run dev
# Frontend runs at http://localhost:5173
```

### Demo Access

Open http://localhost:5173 and select:
- **Investor** → Full trading assistant experience
- **CMF Inspector** → Market surveillance dashboard

---

## Project Structure

```
KANZ-Petitfour/
├── backend/                 # FastAPI backend server
│   ├── app/
│   │   ├── api/routes/      # REST API endpoints
│   │   ├── services/        # ML integration services
│   │   ├── agent/           # LangGraph AI agent
│   │   ├── db/              # Database models
│   │   └── core/            # Configuration
│   └── requirements.txt
│
├── frontend/                # React + Vite frontend
│   ├── src/
│   │   ├── pages/           # Investor & Inspector pages
│   │   ├── components/      # Reusable UI components
│   │   └── services/        # API client
│   └── package.json
│
├── ml/                      # Machine Learning models
│   ├── notebooks/           # Training notebooks
│   ├── models/              # Trained model files
│   └── src/                 # Inference code
│
├── nlp/                     # NLP & Sentiment Analysis
│   ├── scrapers/            # News scrapers
│   └── sentiment/           # Sentiment analyzer
│
└── cahier-de-charges-code_lab2.0-main/  # BVMT historical data
```

---

## Technologies Used

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 19, Vite, TailwindCSS | Modern, fast UI |
| **Backend** | FastAPI, SQLModel, Supabase | High-performance API |
| **ML** | XGBoost, scikit-learn | Price prediction, anomaly detection |
| **NLP** | HuggingFace Transformers, BeautifulSoup | Sentiment analysis, web scraping |
| **AI Agent** | LangGraph, LangChain | Conversational AI with tools |
| **Database** | SQLite (local), PostgreSQL (production) | Data persistence |

---

## ML Model Performance

### Price Prediction (XGBoost)

| Metric | 1-Day | 3-Day | 5-Day |
|--------|-------|-------|-------|
| RMSE | 0.012 | 0.018 | 0.024 |
| MAE | 0.008 | 0.013 | 0.019 |
| Directional Accuracy | 62% | 58% | 55% |

### Anomaly Detection (Isolation Forest)

| Metric | Score |
|--------|-------|
| Precision | 0.85 |
| Recall | 0.78 |
| F1-Score | 0.81 |

---

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/stocks` | GET | List all stocks |
| `/api/stocks/{code}/prediction` | GET | Get 5-day prediction |
| `/api/stocks/{code}/sentiment` | GET | Get sentiment score |
| `/api/stocks/{code}/anomaly` | GET | Check for anomalies |
| `/api/stocks/{code}/recommendation` | GET | Get AI recommendation |
| `/api/market/overview` | GET | Market summary |
| `/api/portfolio` | GET/POST | Portfolio operations |
| `/api/alerts` | GET | Recent alerts |
| `/api/agent/chat` | POST | Chat with AI agent |
| `/health` | GET | Health check |
| `/api/health/ml` | GET | ML models status |

---

## Team

| Role | Member |
|------|--------|
| Team Leader & Full Stack | Oussema |
| ML Engineer | - |
| NLP Engineer | - |
| Presenter | - |

---

## Future Improvements

1. **Real-time WebSocket** for live price updates
2. **Mobile app** using React Native
3. **Advanced RL** for portfolio optimization
4. **Arabic UI** for better accessibility
5. **Social features** for community learning

---

## License

This project was created for IHEC-CODELAB 2.0 Hackathon.

---

<div align="center">
  <h3>🏆 KANZ - Making Trading Accessible for All Tunisians 🇹🇳</h3>
  <p>Built with ❤️ for IHEC-CODELAB 2.0</p>
</div>
