# KANZ Backend

FastAPI-based backend server providing REST APIs for the KANZ trading assistant platform.

## Architecture

```
backend/
├── app/
│   ├── api/
│   │   └── routes/          # API endpoint handlers
│   │       ├── stocks.py    # Stock data & predictions
│   │       ├── market.py    # Market overview & live data
│   │       ├── portfolio.py # Portfolio management
│   │       ├── alerts.py    # Alert system
│   │       ├── news.py      # News & sentiment
│   │       ├── agent.py     # LangGraph AI agent
│   │       ├── auth.py      # Authentication
│   │       └── profile.py   # Investor profiling
│   │
│   ├── services/            # Business logic layer
│   │   ├── prediction.py    # ML prediction integration
│   │   ├── anomaly.py       # Anomaly detection integration
│   │   ├── sentiment.py     # Sentiment analysis integration
│   │   ├── decision.py      # Decision agent logic
│   │   ├── investor_profile.py  # Risk profiling
│   │   └── market_data.py   # Live market data scraping
│   │
│   ├── agent/               # LangGraph AI Agent
│   │   ├── graph.py         # Agent workflow definition
│   │   ├── tools.py         # Agent tools (prediction, anomaly, etc.)
│   │   └── rag.py           # CMF regulation knowledge base
│   │
│   ├── db/                  # Database layer
│   │   ├── database.py      # SQLModel models
│   │   └── data_loader.py   # Historical data import
│   │
│   └── core/                # Configuration
│       ├── config.py        # Environment settings
│       └── auth.py          # Supabase auth helpers
│
├── run.py                   # Application entry point
├── requirements.txt         # Python dependencies
└── .env                     # Environment variables
```

## API Routes

### Market Data

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/market/overview` | GET | Market summary with TUNINDEX, top movers |
| `GET /api/market/top-movers` | GET | Top gainers and losers |
| `GET /api/market/sentiment` | GET | Overall market sentiment |
| `GET /api/market/live` | GET | Live data from ilboursa.com |

### Stock Analysis

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/stocks` | GET | List all available stocks |
| `GET /api/stocks/{code}` | GET | Stock details |
| `GET /api/stocks/{code}/history` | GET | Price history |
| `GET /api/stocks/{code}/prediction` | GET | 5-day price prediction |
| `GET /api/stocks/{code}/sentiment` | GET | Sentiment score |
| `GET /api/stocks/{code}/anomaly` | GET | Anomaly detection |
| `GET /api/stocks/{code}/recommendation` | GET | AI recommendation |

### Portfolio

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /api/portfolio` | GET | Get user portfolio |
| `POST /api/portfolio/buy` | POST | Execute buy order |
| `POST /api/portfolio/sell` | POST | Execute sell order |

### AI Agent

| Endpoint | Method | Description |
|----------|--------|-------------|
| `POST /api/agent/chat` | POST | Chat with AI agent (streaming) |
| `POST /api/agent/advice` | POST | Get investment advice |

### Health

| Endpoint | Method | Description |
|----------|--------|-------------|
| `GET /health` | GET | Basic health check |
| `GET /api/health/ml` | GET | ML models status |

## Services

### PredictionService

Integrates with XGBoost models for price prediction:

```python
from app.services.prediction import PredictionService

service = PredictionService()
result = service.predict("SFBT", historical_data)
# Returns: {
#   "stock": "SFBT",
#   "predictions": {"day_1": {...}, "day_2": {...}, ...},
#   "recommendation": {"action": "BUY", "confidence": 0.74}
# }
```

### AnomalyService

Detects suspicious market activity:

```python
from app.services.anomaly import AnomalyService

service = AnomalyService()
result = service.detect("SFBT", current_data, historical_stats)
# Returns: {
#   "is_anomaly": True,
#   "severity": "HIGH",
#   "alerts": [{"type": "VOLUME_SPIKE", "message": "..."}]
# }
```

### SentimentService

Analyzes news sentiment:

```python
from app.services.sentiment import SentimentService

service = SentimentService()
result = service.analyze("SFBT annonce un nouveau partenariat...")
# Returns: {"score": 0.72, "label": "positive"}
```

## Database Models

### Stock
```python
class Stock(SQLModel, table=True):
    code: str           # Primary key (e.g., "SFBT")
    name: str           # Full name
    sector: str         # Industry sector
    groupe: int         # Market group (11 = main)
```

### PriceData
```python
class PriceData(SQLModel, table=True):
    stock_code: str
    date: date
    open: float
    high: float
    low: float
    close: float
    volume: int
    transactions: int
```

### Portfolio
```python
class Portfolio(SQLModel, table=True):
    user_id: str
    stock_code: str
    quantity: int
    avg_price: float
```

### Alert
```python
class Alert(SQLModel, table=True):
    stock_code: str
    alert_type: str     # VOLUME_SPIKE, PRICE_MOVE, etc.
    severity: str       # HIGH, MEDIUM, LOW
    message: str
    created_at: datetime
```

## Quick Start

```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your settings

# Run server
python run.py
```

Server runs at http://localhost:8000

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `SUPABASE_URL` | Supabase project URL | - |
| `SUPABASE_KEY` | Supabase anon key | - |
| `DATABASE_URL` | PostgreSQL connection string | SQLite |
| `GROQ_API_KEY` | Groq API key for LangGraph | - |
| `DEMO_MODE` | Enable demo mode | `true` |
| `ENABLE_NEWS_SCHEDULER` | Auto-scrape news | `false` |

## Startup Flow

1. **Database Initialization**: Creates tables if not exist
2. **Data Loading**: Imports historical BVMT data (2016-2025)
3. **ML Preloading**: Loads XGBoost and IsolationForest models
4. **News Scheduler**: Optional background news scraping

## ML Integration

Models are loaded from `../ml/models/`:

- `xgb_predictor_1d.json` through `xgb_predictor_5d.json` - Price prediction
- `anomaly/anomaly_detector.pkl` - Isolation Forest
- `feature_scaler.pkl` - Feature normalization

If models are not found, services fall back to rule-based heuristics.

## Testing

```bash
# Health check
curl http://localhost:8000/health

# ML status
curl http://localhost:8000/api/health/ml

# Get stock prediction
curl http://localhost:8000/api/stocks/SFBT/prediction
```
