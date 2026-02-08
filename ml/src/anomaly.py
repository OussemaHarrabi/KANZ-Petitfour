"""
BVMT Anomaly Detection Service
Real-time market surveillance and alert generation.
"""

import json
import numpy as np
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import joblib


class BVMTAnomalyDetector:
    """
    Production-ready anomaly detection for BVMT stocks.
    Combines rule-based thresholds with Isolation Forest for robust detection.
    """
    
    THRESHOLDS = {
        'volume_spike_zscore': 3.0,
        'price_change_pct': 0.05,
        'gap_open_pct': 0.03,
        'range_ratio': 2.0
    }
    
    FEATURE_COLS = [
        'volume_zscore', 'volume_ratio', 'price_change_abs', 'price_zscore',
        'intraday_range', 'range_ratio', 'gap_open_abs', 'tx_ratio', 'vol_price_ratio'
    ]
    
    def __init__(self, model_dir: str):
        self.model_dir = Path(model_dir)
        self.model = None
        self.scaler = None
        self._load_models()
    
    def _load_models(self):
        try:
            model_path = self.model_dir / 'anomaly_detector.pkl'
            scaler_path = self.model_dir / 'anomaly_scaler.pkl'
            
            if model_path.exists():
                self.model = joblib.load(model_path)
            if scaler_path.exists():
                self.scaler = joblib.load(scaler_path)
                
            if self.model:
                print("[OK] Anomaly detection models loaded")
        except Exception as e:
            print(f"[WARN] Could not load models: {e}")
    
    def detect(self, stock_name: str, current_data: Dict, historical_stats: Dict) -> Dict:
        features = self._calculate_features(current_data, historical_stats)
        
        alerts = []
        severity_score = 0
        
        if features['volume_zscore'] > self.THRESHOLDS['volume_spike_zscore']:
            alerts.append({
                'type': 'VOLUME_SPIKE',
                'message': f"Volume is {features['volume_zscore']:.1f} std above average",
                'severity': 'HIGH' if features['volume_zscore'] > 5 else 'MEDIUM'
            })
            severity_score += 0.3
        
        if features['price_change_abs'] > self.THRESHOLDS['price_change_pct']:
            direction = 'up' if features.get('price_change', 0) > 0 else 'down'
            alerts.append({
                'type': 'PRICE_MOVE',
                'message': f"Price moved {features['price_change_abs']*100:.1f}% {direction}",
                'severity': 'HIGH' if features['price_change_abs'] > 0.10 else 'MEDIUM'
            })
            severity_score += 0.3
        
        if features['gap_open_abs'] > self.THRESHOLDS['gap_open_pct']:
            alerts.append({
                'type': 'GAP_OPEN',
                'message': f"Gap open of {features['gap_open_abs']*100:.1f}%",
                'severity': 'MEDIUM'
            })
            severity_score += 0.1
        
        if self.model and self.scaler:
            X = np.array([[features.get(col, 0) for col in self.FEATURE_COLS]])
            X = np.nan_to_num(X, nan=0, posinf=0, neginf=0)
            X_scaled = self.scaler.transform(X)
            
            ml_prediction = self.model.predict(X_scaled)[0]
            ml_score = self.model.decision_function(X_scaled)[0]
            
            if ml_prediction == -1:
                alerts.append({
                    'type': 'ML_ANOMALY',
                    'message': f"Unusual pattern detected (score: {ml_score:.3f})",
                    'severity': 'MEDIUM'
                })
                severity_score += 0.2
        
        if severity_score >= 0.6:
            overall_severity = 'HIGH'
        elif severity_score >= 0.3:
            overall_severity = 'MEDIUM'
        elif severity_score > 0:
            overall_severity = 'LOW'
        else:
            overall_severity = 'NONE'
        
        return {
            'stock': stock_name,
            'timestamp': datetime.now().isoformat(),
            'is_anomaly': len(alerts) > 0,
            'severity': overall_severity,
            'severity_score': round(severity_score, 2),
            'alerts': alerts,
            'features': {k: round(v, 4) if isinstance(v, float) else v for k, v in features.items()}
        }
    
    def _calculate_features(self, current: Dict, historical: Dict) -> Dict:
        volume = current.get('volume', 0)
        close = current.get('close', 0)
        open_price = current.get('open', close)
        high = current.get('high', close)
        low = current.get('low', close)
        prev_close = historical.get('prev_close', close)
        
        vol_ma = historical.get('volume_ma_20', volume)
        vol_std = historical.get('volume_std_20', 1)
        price_ma = historical.get('price_ma_20', close)
        price_std = historical.get('price_std_20', 1)
        range_ma = historical.get('range_ma_10', 0.01)
        tx_ma = historical.get('tx_ma_20', 1)
        
        price_change = (close - prev_close) / prev_close if prev_close > 0 else 0
        intraday_range = (high - low) / close if close > 0 else 0
        gap_open = (open_price - prev_close) / prev_close if prev_close > 0 else 0
        
        return {
            'volume_zscore': (volume - vol_ma) / vol_std if vol_std > 0 else 0,
            'volume_ratio': volume / vol_ma if vol_ma > 0 else 1,
            'price_change': price_change,
            'price_change_abs': abs(price_change),
            'price_zscore': (close - price_ma) / price_std if price_std > 0 else 0,
            'intraday_range': intraday_range,
            'range_ratio': intraday_range / range_ma if range_ma > 0 else 1,
            'gap_open_abs': abs(gap_open),
            'tx_ratio': current.get('transactions', 0) / tx_ma if tx_ma > 0 else 1,
            'vol_price_ratio': (volume / vol_ma) / (abs(price_change) + 0.001) if vol_ma > 0 else 0
        }
    
    def detect_batch(self, stock_data: List[Dict]) -> List[Dict]:
        """Detect anomalies for multiple data points."""
        return [
            self.detect(
                item['stock_name'],
                item['current'],
                item['historical']
            )
            for item in stock_data
        ]


def get_anomaly_detection(stock_name: str, current_data: Dict, 
                          historical_stats: Dict, model_dir: str = 'ml/models/') -> Dict:
    detector = BVMTAnomalyDetector(model_dir)
    return detector.detect(stock_name, current_data, historical_stats)
