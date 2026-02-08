from __future__ import annotations

import logging
import sys
from datetime import datetime, timedelta
from pathlib import Path
from typing import Dict, Optional

import numpy as np
import pandas as pd

from app.core.config import ML_MODELS_DIR

logger = logging.getLogger("kanz.prediction")

sys.path.insert(0, str(Path(__file__).resolve().parents[3] / "ml" / "src"))

_predictor = None
_predictor_error: Optional[str] = None


def _get_predictor():
    """Load the XGBoost price predictor with proper error logging."""
    global _predictor, _predictor_error
    
    if _predictor is not None:
        return _predictor
    
    if _predictor_error is not None:
        return None
    
    try:
        from prediction import BVMTPricePredictor
        
        if not ML_MODELS_DIR.exists():
            _predictor_error = f"Model directory not found: {ML_MODELS_DIR}"
            logger.warning(_predictor_error)
            return None
        
        model_files = list(ML_MODELS_DIR.glob("*.json"))
        if not model_files:
            _predictor_error = f"No XGBoost model files (*.json) found in {ML_MODELS_DIR}"
            logger.warning(_predictor_error)
            return None
        
        logger.info(f"Loading XGBoost models from {ML_MODELS_DIR}...")
        _predictor = BVMTPricePredictor(str(ML_MODELS_DIR))
        logger.info(f"[OK] Loaded {len(_predictor.models)} XGBoost models")
        return _predictor
        
    except ImportError as e:
        _predictor_error = f"Cannot import BVMTPricePredictor: {e}"
        logger.error(_predictor_error)
    except Exception as e:
        _predictor_error = f"Failed to load prediction models: {e}"
        logger.error(_predictor_error)
    
    return None


class PredictionService:
    def __init__(self):
        self.predictor = _get_predictor()

    def predict(self, stock_code: str, history: pd.DataFrame) -> Dict:
        if history.empty or len(history) < 60:
            logger.debug(f"Insufficient history for {stock_code}: {len(history)} rows (need 60)")
            return self._fallback_prediction(stock_code, history)

        if self.predictor is not None:
            try:
                history_clean = history.copy()
                history_clean.columns = [c.lower() for c in history_clean.columns]
                if 'date' in history_clean.columns:
                    history_clean['date'] = pd.to_datetime(history_clean['date'])
                
                result = self.predictor.predict_from_history(stock_code, history_clean)
                
                if 'error' not in result or result.get('predictions'):
                    result['model'] = 'xgboost'
                    return result
            except Exception as e:
                logger.warning(f"XGBoost prediction failed for {stock_code}: {e}")

        return self._fallback_prediction(stock_code, history)

    def _fallback_prediction(self, stock_code: str, history: pd.DataFrame) -> Dict:
        if history.empty:
            current_price = 10.0
        else:
            close_col = 'close' if 'close' in history.columns else 'Close'
            current_price = float(history[close_col].iloc[-1])

        recent = history.tail(20) if len(history) >= 20 else history
        if len(recent) > 1:
            close_col = 'close' if 'close' in recent.columns else 'Close'
            returns = recent[close_col].pct_change().dropna()
            avg_return = float(returns.mean()) if len(returns) > 0 else 0.0
        else:
            avg_return = 0.0

        predictions = {}
        for day in range(1, 6):
            predicted_price = current_price * (1 + avg_return * day)
            predictions[f"day_{day}"] = {
                "date": (datetime.now() + timedelta(days=day)).strftime("%Y-%m-%d"),
                "predicted_price": round(predicted_price, 3),
                "predicted_return_pct": round(avg_return * 100 * day, 2),
                "direction": "UP" if avg_return >= 0 else "DOWN",
                "confidence": min(round(abs(avg_return) * 10 + 0.3, 2), 0.7),
            }

        if avg_return > 0.01:
            recommendation = "BUY"
        elif avg_return < -0.01:
            recommendation = "SELL"
        else:
            recommendation = "HOLD"

        return {
            "stock": stock_code,
            "current_price": round(current_price, 3),
            "timestamp": datetime.now().isoformat(),
            "model": "fallback",
            "predictions": predictions,
            "recommendation": {
                "action": recommendation,
                "confidence": min(round(abs(avg_return) * 15 + 0.3, 2), 0.7),
                "avg_5d_return_pct": round(avg_return * 100, 2),
                "reasons": [
                    "📈 Based on recent price trend analysis",
                    "📊 Using moving average momentum",
                    "⚠️ XGBoost model not loaded - using simplified forecast",
                ],
            },
        }
