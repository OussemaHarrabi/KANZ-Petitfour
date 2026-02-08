"""Anomaly detection service using ML IsolationForest with rule-based fallback."""

from __future__ import annotations

import logging
import sys
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

logger = logging.getLogger("kanz.anomaly")

ML_SRC_PATH = Path(__file__).parent.parent.parent.parent / "ml" / "src"
if str(ML_SRC_PATH) not in sys.path:
    sys.path.insert(0, str(ML_SRC_PATH))

_detector: Any = None
_detector_error: Optional[str] = None

try:
    from anomaly import BVMTAnomalyDetector
    ML_DETECTOR_AVAILABLE = True
except ImportError as e:
    ML_DETECTOR_AVAILABLE = False
    BVMTAnomalyDetector = None
    logger.warning(f"BVMTAnomalyDetector not available: {e}")


def _get_detector() -> Any:
    global _detector, _detector_error
    
    if _detector is not None:
        return _detector
    
    if _detector_error is not None:
        return None
    
    if not ML_DETECTOR_AVAILABLE or BVMTAnomalyDetector is None:
        _detector_error = "BVMTAnomalyDetector class not available"
        return None
    
    model_dir = Path(__file__).parent.parent.parent.parent / "ml" / "models" / "anomaly"
    
    if not model_dir.exists():
        _detector_error = f"Anomaly model directory not found: {model_dir}"
        logger.warning(_detector_error)
        return None
    
    try:
        logger.info(f"Loading anomaly detector from {model_dir}...")
        _detector = BVMTAnomalyDetector(str(model_dir))
        logger.info("[OK] Anomaly detection model loaded")
        return _detector
    except Exception as e:
        _detector_error = f"Failed to load anomaly detector: {e}"
        logger.error(_detector_error)
        return None


class AnomalyService:
    def __init__(self):
        self.detector = _get_detector()
        self.thresholds = {
            "volume_spike": 3.0,
            "price_change": 0.05,
        }

    def detect(self, stock_code: str, current: Dict, history_stats: Dict) -> Dict:
        """
        Required keys for current: open, high, low, close, volume, transactions.
        Required keys for history_stats: prev_close, volume_ma_20, volume_std_20,
        price_ma_20, price_std_20, range_ma_10, tx_ma_20.
        """
        if self.detector:
            return self.detector.detect(stock_code, current, history_stats)
        return self._fallback_detect(stock_code, current, history_stats)
    
    def _fallback_detect(self, stock_code: str, current: Dict, history_stats: Dict) -> Dict:
        alerts = []
        severity_score = 0.0

        volume = current.get("volume", 0)
        avg_volume = history_stats.get("volume_ma_20", volume)
        vol_ratio = volume / avg_volume if avg_volume else 1
        if vol_ratio > self.thresholds["volume_spike"]:
            alerts.append({
                "type": "VOLUME_SPIKE",
                "message": f"Volume ratio {vol_ratio:.1f}x above average",
                "severity": "MEDIUM",
            })
            severity_score += 0.3

        prev_close = history_stats.get("prev_close", current.get("close", 0))
        close = current.get("close", prev_close)
        price_change = (close - prev_close) / prev_close if prev_close else 0
        if abs(price_change) > self.thresholds["price_change"]:
            alerts.append({
                "type": "PRICE_MOVE",
                "message": f"Price moved {price_change * 100:.1f}%",
                "severity": "MEDIUM",
            })
            severity_score += 0.3

        severity = "NONE"
        if severity_score >= 0.6:
            severity = "HIGH"
        elif severity_score >= 0.3:
            severity = "MEDIUM"
        elif severity_score > 0:
            severity = "LOW"

        return {
            "stock": stock_code,
            "timestamp": datetime.now().isoformat(),
            "is_anomaly": bool(alerts),
            "severity": severity,
            "severity_score": round(severity_score, 2),
            "alerts": alerts,
            "features": {},
        }
    
    def detect_batch(self, stock_data: List[Dict]) -> List[Dict]:
        if self.detector:
            formatted_data = [
                {
                    "stock_name": item["stock_code"],
                    "current": item["current"],
                    "historical": item["historical"],
                }
                for item in stock_data
            ]
            return self.detector.detect_batch(formatted_data)
        
        return [
            self._fallback_detect(item["stock_code"], item["current"], item.get("historical", {}))
            for item in stock_data
        ]
    
    def is_ml_enabled(self) -> bool:
        return self.detector is not None
