# Model Directory

Place your trained XGBoost model files here:

## Required Files

```
ml/models/
├── price_predictor_1d.json   # XGBoost model for 1-day prediction
├── price_predictor_2d.json   # XGBoost model for 2-day prediction  
├── price_predictor_3d.json   # XGBoost model for 3-day prediction
├── price_predictor_4d.json   # XGBoost model for 4-day prediction
├── price_predictor_5d.json   # XGBoost model for 5-day prediction
├── feature_scaler.pkl        # StandardScaler for feature normalization
└── config.json               # Model configuration
```

## How to Export from Notebook

After training in your notebook, run:

```python
# Save each model
for horizon in [1, 2, 3, 4, 5]:
    model = models[horizon]  # your trained model
    model.save_model(f'models/price_predictor_{horizon}d.json')

# Save scaler
import joblib
joblib.dump(scaler, 'models/feature_scaler.pkl')

# Save config
import json
config = {
    'feature_columns': FEATURE_COLS,
    'prediction_horizons': [1, 2, 3, 4, 5]
}
with open('models/config.json', 'w') as f:
    json.dump(config, f)
```

## Backend Integration

The backend will automatically load these models when they exist.
Check `backend/app/services/prediction.py` for integration details.
