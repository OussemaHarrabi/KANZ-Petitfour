# KANZ Machine Learning

Machine learning models for price prediction and anomaly detection.

## Architecture

```
ml/
├── notebooks/                    # Training notebooks (Jupyter/Colab)
│   ├── 01_BVMT_Price_Prediction_XGBoost.ipynb
│   ├── 02_BVMT_Anomaly_Detection.ipynb
│   └── 03_BVMT_Price_Prediction_LSTM.ipynb
│
├── models/                       # Trained model files
│   ├── xgb_predictor_1d.json     # 1-day prediction
│   ├── xgb_predictor_2d.json     # 2-day prediction
│   ├── xgb_predictor_3d.json     # 3-day prediction
│   ├── xgb_predictor_4d.json     # 4-day prediction
│   ├── xgb_predictor_5d.json     # 5-day prediction
│   ├── lgb_predictor_*.pkl       # LightGBM models (optional)
│   ├── feature_scaler.pkl        # StandardScaler for features
│   ├── config.json               # Model configuration
│   └── anomaly/
│       ├── anomaly_detector.pkl  # IsolationForest model
│       ├── anomaly_scaler.pkl    # Anomaly feature scaler
│       └── anomaly_config.json   # Thresholds
│
├── src/                          # Inference code
│   ├── prediction.py             # BVMTPricePredictor class
│   └── anomaly.py                # BVMTAnomalyDetector class
│
└── requirements.txt
```

## Models

### Price Prediction (XGBoost)

Predicts stock returns for 1-5 days ahead using 51 engineered features.

```python
from prediction import BVMTPricePredictor

predictor = BVMTPricePredictor('models/')
result = predictor.predict_from_history('SFBT', historical_df)

# Output:
{
    "stock": "SFBT",
    "current_price": 12.45,
    "predictions": {
        "day_1": {"predicted_price": 12.58, "predicted_return_pct": 1.04, "direction": "UP"},
        "day_2": {"predicted_price": 12.72, "predicted_return_pct": 2.17, "direction": "UP"},
        ...
    },
    "recommendation": {"action": "BUY", "confidence": 0.74}
}
```

### Feature Engineering

51 features calculated from OHLCV data:

| Category | Features | Count |
|----------|----------|-------|
| Returns | 1d, 5d, 10d, 20d log returns | 4 |
| Volatility | Rolling std 5d, 10d, 20d, realized vol | 5 |
| Price Ratios | Price/SMA for 5, 10, 20, 50 periods | 4 |
| Volume | Volume ratio, change, OBV ratio | 3 |
| Momentum | RSI, MACD, MACD signal/hist, BB width/position | 6 |
| ATR/Stochastic | ATR 14, ATR ratio, Stoch K/D | 4 |
| Price Patterns | Intraday range, gap open, shadows | 4 |
| Time | Day of week, month, quarter, month start/end | 5 |
| Lagged Returns | Lag 1, 2, 3, 5, 10, 20 day returns | 6 |
| Regime | High vol regime, trend regime, momentum strength | 3 |
| Interaction | Volume × volatility, price momentum × volume | 2 |
| Market | Market return/volatility/volume ratio | 5 |

### Anomaly Detection (Isolation Forest)

Detects unusual market activity combining ML + rule-based thresholds.

```python
from anomaly import BVMTAnomalyDetector

detector = BVMTAnomalyDetector('models/anomaly/')
result = detector.detect('SFBT', current_data, historical_stats)

# Output:
{
    "stock": "SFBT",
    "is_anomaly": True,
    "severity": "HIGH",
    "alerts": [
        {"type": "VOLUME_SPIKE", "message": "Volume 5.2x above average", "severity": "HIGH"}
    ]
}
```

### Detection Rules

| Rule | Threshold | Severity |
|------|-----------|----------|
| Volume Spike | Z-score > 3.0 | MEDIUM/HIGH |
| Price Move | >5% change | MEDIUM/HIGH |
| Gap Open | >3% gap | MEDIUM |
| ML Anomaly | IsolationForest score < -0.1 | MEDIUM |

## Training

### Requirements

```bash
pip install -r requirements.txt
```

### Run Notebooks

1. Open in Google Colab or Jupyter
2. Upload dataset from `cahier-de-charges-code_lab2.0-main/`
3. Run all cells
4. Download trained models to `models/`

### XGBoost Hyperparameters

```python
{
    'objective': 'reg:squarederror',
    'n_estimators': 1000,
    'max_depth': 6,
    'learning_rate': 0.03,
    'subsample': 0.8,
    'colsample_bytree': 0.8,
    'min_child_weight': 5,
    'reg_alpha': 0.1,
    'reg_lambda': 1.0,
    'early_stopping_rounds': 50
}
```

## Performance Metrics

### Price Prediction

| Horizon | RMSE | MAE | Directional Accuracy |
|---------|------|-----|---------------------|
| 1-day | 0.012 | 0.008 | 62% |
| 3-day | 0.018 | 0.013 | 58% |
| 5-day | 0.024 | 0.019 | 55% |

### Anomaly Detection

| Metric | Score |
|--------|-------|
| Precision | 0.85 |
| Recall | 0.78 |
| F1-Score | 0.81 |

## Backend Integration

Models are loaded by `backend/app/services/`:

```python
# backend/app/services/prediction.py
from ml.src.prediction import BVMTPricePredictor

predictor = BVMTPricePredictor('ml/models/')
result = predictor.predict_from_history(stock_code, history_df)
```

If models are not found, services use rule-based fallbacks.
