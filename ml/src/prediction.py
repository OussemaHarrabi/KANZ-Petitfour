"""
BVMT Price Prediction Service
Production-ready inference module for backend integration.

Usage:
    from prediction import BVMTPricePredictor
    
    predictor = BVMTPricePredictor('ml/models/')
    result = predictor.predict('SFBT', stock_data)
"""

import json
import numpy as np
import pandas as pd
from pathlib import Path
from typing import Dict, List, Optional, Union
from datetime import datetime, timedelta
import joblib
import xgboost as xgb


class FeatureEngineer:
    """
    Feature engineering for BVMT stock data.
    Calculates all technical indicators and features needed for prediction.
    """
    
    @staticmethod
    def calculate_features(df: pd.DataFrame, market_df: pd.DataFrame = None) -> pd.DataFrame:
        """
        Calculate all 51 features from OHLCV data.
        
        Args:
            df: DataFrame with columns [date, open, high, low, close, volume, transactions]
                Should contain at least 60 days of historical data.
            market_df: Optional DataFrame with market-wide data for market features.
                       If None, market features will be set to neutral values.
        
        Returns:
            DataFrame with all calculated features
        """
        df = df.copy().sort_values('date').reset_index(drop=True)
        
        # ===== PRICE RETURNS (4 features) =====
        df['return_1d'] = np.log(df['close'] / df['close'].shift(1))
        df['return_5d'] = np.log(df['close'] / df['close'].shift(5))
        df['return_10d'] = np.log(df['close'] / df['close'].shift(10))
        df['return_20d'] = np.log(df['close'] / df['close'].shift(20))
        
        # ===== VOLATILITY (5 features) =====
        df['volatility_5d'] = df['return_1d'].rolling(5).std()
        df['volatility_10d'] = df['return_1d'].rolling(10).std()
        df['volatility_20d'] = df['return_1d'].rolling(20).std()
        # Realized volatility (annualized)
        df['realized_vol_5d'] = df['return_1d'].rolling(5).std() * np.sqrt(252)
        df['realized_vol_10d'] = df['return_1d'].rolling(10).std() * np.sqrt(252)
        
        # ===== MOVING AVERAGES & PRICE RATIOS (4 features) =====
        for window in [5, 10, 20, 50]:
            df[f'sma_{window}'] = df['close'].rolling(window).mean()
            df[f'price_to_sma_{window}'] = df['close'] / df[f'sma_{window}']
        
        # EMA (used for MACD calculation)
        df['ema_12'] = df['close'].ewm(span=12).mean()
        df['ema_26'] = df['close'].ewm(span=26).mean()
        
        # ===== VOLUME FEATURES (3 features) =====
        df['volume_sma_5'] = df['volume'].rolling(5).mean()
        df['volume_sma_20'] = df['volume'].rolling(20).mean()
        df['volume_ratio'] = df['volume'] / df['volume_sma_20']
        df['volume_change'] = df['volume'].pct_change()
        
        # On-Balance Volume (OBV) ratio
        df['obv'] = (np.sign(df['close'].diff()) * df['volume']).fillna(0).cumsum()
        df['obv_sma_20'] = df['obv'].rolling(20).mean()
        df['obv_ratio'] = df['obv'] / df['obv_sma_20'].replace(0, np.nan)
        df['obv_ratio'] = df['obv_ratio'].fillna(1)
        
        # ===== MOMENTUM INDICATORS (6 features) =====
        
        # RSI
        delta = df['close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss.replace(0, np.nan)
        df['rsi_14'] = 100 - (100 / (1 + rs))
        df['rsi_14'] = df['rsi_14'].fillna(50)
        
        # MACD
        df['macd'] = df['ema_12'] - df['ema_26']
        df['macd_signal'] = df['macd'].ewm(span=9).mean()
        df['macd_hist'] = df['macd'] - df['macd_signal']
        
        # Bollinger Bands
        df['bb_middle'] = df['close'].rolling(20).mean()
        df['bb_std'] = df['close'].rolling(20).std()
        df['bb_upper'] = df['bb_middle'] + 2 * df['bb_std']
        df['bb_lower'] = df['bb_middle'] - 2 * df['bb_std']
        df['bb_width'] = (df['bb_upper'] - df['bb_lower']) / df['bb_middle']
        bb_range = (df['bb_upper'] - df['bb_lower']).replace(0, np.nan)
        df['bb_position'] = (df['close'] - df['bb_lower']) / bb_range
        df['bb_position'] = df['bb_position'].fillna(0.5)
        
        # ===== ATR & STOCHASTIC (4 features) =====
        
        # Average True Range (ATR)
        high_low = df['high'] - df['low']
        high_close = np.abs(df['high'] - df['close'].shift())
        low_close = np.abs(df['low'] - df['close'].shift())
        tr = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
        df['atr_14'] = tr.rolling(14).mean()
        df['atr_ratio'] = df['atr_14'] / df['close']
        
        # Stochastic Oscillator
        low_14 = df['low'].rolling(14).min()
        high_14 = df['high'].rolling(14).max()
        stoch_range = (high_14 - low_14).replace(0, np.nan)
        df['stoch_k'] = 100 * (df['close'] - low_14) / stoch_range
        df['stoch_k'] = df['stoch_k'].fillna(50)
        df['stoch_d'] = df['stoch_k'].rolling(3).mean()
        
        # ===== PRICE PATTERNS (4 features) =====
        df['intraday_range'] = (df['high'] - df['low']) / df['close']
        df['gap_open'] = (df['open'] - df['close'].shift(1)) / df['close'].shift(1)
        
        # Candlestick shadows
        body_high = df[['open', 'close']].max(axis=1)
        body_low = df[['open', 'close']].min(axis=1)
        body_size = (body_high - body_low).replace(0, np.nan)
        df['upper_shadow'] = (df['high'] - body_high) / body_size
        df['lower_shadow'] = (body_low - df['low']) / body_size
        df['upper_shadow'] = df['upper_shadow'].fillna(0)
        df['lower_shadow'] = df['lower_shadow'].fillna(0)
        
        # ===== TIME FEATURES (5 features) =====
        df['day_of_week'] = df['date'].dt.dayofweek
        df['month'] = df['date'].dt.month
        df['quarter'] = df['date'].dt.quarter
        df['is_month_start'] = df['date'].dt.is_month_start.astype(int)
        df['is_month_end'] = df['date'].dt.is_month_end.astype(int)
        
        # ===== LAGGED RETURNS (6 features) =====
        for lag in [1, 2, 3, 5, 10, 20]:
            df[f'lag_{lag}d_return'] = np.log(df['close'] / df['close'].shift(lag))
        
        # ===== REGIME FEATURES (3 features) =====
        # High volatility regime (1 if volatility > 1.5x median)
        vol_median = df['volatility_20d'].rolling(60).median()
        df['high_vol_regime'] = (df['volatility_20d'] > 1.5 * vol_median).astype(int)
        
        # Trend regime: 1 = uptrend, -1 = downtrend, 0 = sideways
        df['trend_regime'] = np.where(
            df['price_to_sma_20'] > 1.02, 1,
            np.where(df['price_to_sma_20'] < 0.98, -1, 0)
        )
        
        # Momentum strength (normalized MACD histogram)
        macd_std = df['macd_hist'].rolling(20).std().replace(0, np.nan)
        df['momentum_strength'] = df['macd_hist'] / macd_std
        df['momentum_strength'] = df['momentum_strength'].clip(-3, 3).fillna(0)
        
        # ===== INTERACTION FEATURES (2 features) =====
        df['vol_times_volatility'] = df['volume_ratio'] * df['volatility_20d']
        df['price_momentum_vol'] = df['return_5d'] * df['volume_ratio']
        
        # ===== MARKET-WIDE FEATURES (5 features) =====
        if market_df is not None and len(market_df) > 0:
            # Calculate market features from market data
            market_df = market_df.copy().sort_values('date').reset_index(drop=True)
            market_df['market_return_1d'] = np.log(market_df['close'] / market_df['close'].shift(1))
            market_df['market_return_5d'] = np.log(market_df['close'] / market_df['close'].shift(5))
            market_df['market_volatility_5d'] = market_df['market_return_1d'].rolling(5).std()
            market_df['market_volatility_20d'] = market_df['market_return_1d'].rolling(20).std()
            market_df['market_volume_sma_20'] = market_df['volume'].rolling(20).mean()
            market_df['market_volume_ratio'] = market_df['volume'] / market_df['market_volume_sma_20']
            
            # Merge market features
            market_cols = ['date', 'market_return_1d', 'market_return_5d', 
                          'market_volatility_5d', 'market_volatility_20d', 'market_volume_ratio']
            df = df.merge(market_df[market_cols], on='date', how='left')
        else:
            # Set neutral values if no market data
            df['market_return_1d'] = 0
            df['market_return_5d'] = 0
            df['market_volatility_5d'] = df['volatility_5d'].mean() if 'volatility_5d' in df else 0.01
            df['market_volatility_20d'] = df['volatility_20d'].mean() if 'volatility_20d' in df else 0.01
            df['market_volume_ratio'] = 1.0
        
        return df


class BVMTPricePredictor:
    """
    Production-ready price prediction service for BVMT stocks.
    
    Usage:
        predictor = BVMTPricePredictor('ml/models/')
        
        # With DataFrame of historical data
        result = predictor.predict_from_history('SFBT', historical_df)
        
        # With pre-calculated features
        result = predictor.predict('SFBT', feature_dict)
    """
    
    # 51 features matching config.json - must be in exact order
    FEATURE_COLS = [
        # Returns (4)
        'return_1d', 'return_5d', 'return_10d', 'return_20d',
        # Volatility (5)
        'volatility_5d', 'volatility_10d', 'volatility_20d',
        'realized_vol_5d', 'realized_vol_10d',
        # Price ratios (4)
        'price_to_sma_5', 'price_to_sma_10', 'price_to_sma_20', 'price_to_sma_50',
        # Volume (3)
        'volume_ratio', 'volume_change', 'obv_ratio',
        # Momentum indicators (6)
        'rsi_14', 'macd', 'macd_signal', 'macd_hist', 'bb_width', 'bb_position',
        # ATR & Stochastic (4)
        'atr_14', 'atr_ratio', 'stoch_k', 'stoch_d',
        # Price patterns (4)
        'intraday_range', 'gap_open', 'upper_shadow', 'lower_shadow',
        # Time features (5)
        'day_of_week', 'month', 'quarter', 'is_month_start', 'is_month_end',
        # Lagged returns (6)
        'lag_1d_return', 'lag_2d_return', 'lag_3d_return', 'lag_5d_return', 
        'lag_10d_return', 'lag_20d_return',
        # Regime features (3)
        'high_vol_regime', 'trend_regime', 'momentum_strength',
        # Interaction features (2)
        'vol_times_volatility', 'price_momentum_vol',
        # Market-wide features (5)
        'market_return_1d', 'market_return_5d', 'market_volatility_5d', 
        'market_volatility_20d', 'market_volume_ratio'
    ]
    
    HORIZONS = [1, 2, 3, 4, 5]
    
    def __init__(self, model_dir: str):
        """
        Initialize the predictor.
        
        Args:
            model_dir: Path to directory containing model files
        """
        self.model_dir = Path(model_dir)
        self.models = {}
        self.scaler = None
        self.config = None
        self.feature_engineer = FeatureEngineer()
        self._load_models()
    
    def _load_models(self):
        """Load all models and configuration."""
        # Load config
        config_path = self.model_dir / 'config.json'
        if config_path.exists():
            with open(config_path, 'r') as f:
                self.config = json.load(f)
        else:
            self.config = {
                'feature_columns': self.FEATURE_COLS,
                'prediction_horizons': self.HORIZONS
            }
        
        # Load scaler
        scaler_path = self.model_dir / 'feature_scaler.pkl'
        if scaler_path.exists():
            self.scaler = joblib.load(scaler_path)
        else:
            print("[WARN] Scaler not found, predictions will not be normalized")
        
        # Load models for each horizon (XGBoost models)
        for horizon in self.HORIZONS:
            model_path = self.model_dir / f'xgb_predictor_{horizon}d.json'
            if model_path.exists():
                model = xgb.XGBRegressor()
                model.load_model(str(model_path))
                self.models[horizon] = model
        
        if self.models:
            print(f"[OK] Loaded {len(self.models)} models for horizons: {list(self.models.keys())}")
        else:
            print("[WARN] No models loaded. Make sure model files exist.")
    
    def predict_from_history(self, stock_name: str, historical_data: pd.DataFrame) -> Dict:
        """
        Predict prices from historical OHLCV data.
        
        Args:
            stock_name: Name of the stock
            historical_data: DataFrame with columns [date, open, high, low, close, volume]
                            Should contain at least 60 days of data.
        
        Returns:
            Prediction dictionary
        """
        # Calculate features
        df = self.feature_engineer.calculate_features(historical_data)
        
        # Get latest row (most recent data point)
        latest = df.iloc[-1]
        
        # Convert to feature dict
        features = {col: latest[col] for col in self.FEATURE_COLS if col in latest.index}
        features['close'] = latest['close']
        
        return self.predict(stock_name, features)
    
    def predict(self, stock_name: str, features: Dict) -> Dict:
        """
        Predict prices from pre-calculated features.
        
        Args:
            stock_name: Name of the stock
            features: Dictionary of feature values
        
        Returns:
            Dictionary with predictions
        """
        if not self.models:
            return {
                'stock': stock_name,
                'error': 'No models loaded',
                'predictions': {}
            }
        
        # Get current price
        current_price = features.get('close', features.get('current_price'))
        if current_price is None:
            return {
                'stock': stock_name,
                'error': "'close' or 'current_price' must be in features",
                'predictions': {}
            }
        
        # Prepare feature vector
        feature_cols = self.config.get('feature_columns', self.FEATURE_COLS)
        X = np.array([[features.get(col, 0) for col in feature_cols]])
        
        # Handle NaN values
        X = np.nan_to_num(X, nan=0.0, posinf=0.0, neginf=0.0)
        
        # Scale if scaler exists
        if self.scaler is not None:
            X_scaled = self.scaler.transform(X)
        else:
            X_scaled = X
        
        # Predict for each horizon using DMatrix (more reliable than sklearn wrapper)
        predictions = {}
        dmat = xgb.DMatrix(X_scaled)
        for horizon in self.HORIZONS:
            if horizon not in self.models:
                continue
            
            # Use booster.predict with DMatrix for reliability
            booster = self.models[horizon].get_booster()
            pred_return = float(booster.predict(dmat)[0])
            pred_price = current_price * (1 + pred_return)
            
            predictions[f'day_{horizon}'] = {
                'date': (datetime.now() + timedelta(days=horizon)).strftime('%Y-%m-%d'),
                'predicted_price': round(pred_price, 3),
                'predicted_return_pct': round(pred_return * 100, 2),
                'direction': 'UP' if pred_return > 0 else 'DOWN',
                'confidence': min(round(abs(pred_return) * 20, 2), 1.0)
            }
        
        # Overall recommendation
        returns = [predictions[f'day_{h}']['predicted_return_pct'] 
                   for h in self.HORIZONS if f'day_{h}' in predictions]
        
        if returns:
            avg_return = np.mean(returns)
            if avg_return > 1.5:
                recommendation = 'BUY'
                confidence = min(avg_return / 5, 1.0)
            elif avg_return < -1.5:
                recommendation = 'SELL'
                confidence = min(abs(avg_return) / 5, 1.0)
            else:
                recommendation = 'HOLD'
                confidence = 1 - abs(avg_return) / 1.5
        else:
            recommendation = 'HOLD'
            avg_return = 0
            confidence = 0.5
        
        return {
            'stock': stock_name,
            'current_price': round(current_price, 3),
            'timestamp': datetime.now().isoformat(),
            'predictions': predictions,
            'recommendation': {
                'action': recommendation,
                'confidence': round(confidence, 2),
                'avg_5d_return_pct': round(avg_return, 2),
                'reasons': self._generate_reasons(features, predictions, recommendation)
            }
        }
    
    def _generate_reasons(self, features: Dict, predictions: Dict, recommendation: str) -> List[str]:
        """Generate human-readable reasons for the recommendation."""
        reasons = []
        
        # Price trend reasons
        avg_return = np.mean([p['predicted_return_pct'] for p in predictions.values()])
        if avg_return > 0:
            reasons.append(f"📈 AI predicts +{avg_return:.1f}% average return over 5 days")
        else:
            reasons.append(f"📉 AI predicts {avg_return:.1f}% average return over 5 days")
        
        # RSI reasons
        rsi = features.get('rsi_14', 50)
        if rsi < 30:
            reasons.append("📊 RSI indicates oversold condition (potential bounce)")
        elif rsi > 70:
            reasons.append("📊 RSI indicates overbought condition (potential correction)")
        
        # MACD reasons
        macd_hist = features.get('macd_hist', 0)
        if macd_hist > 0:
            reasons.append("📈 MACD shows bullish momentum")
        elif macd_hist < 0:
            reasons.append("📉 MACD shows bearish momentum")
        
        # Volume reasons
        volume_ratio = features.get('volume_ratio', 1)
        if volume_ratio > 2:
            reasons.append("🔊 High trading volume indicates strong interest")
        elif volume_ratio < 0.5:
            reasons.append("🔇 Low trading volume - limited market activity")
        
        return reasons[:4]  # Limit to 4 reasons


# Convenience function for API usage
def get_stock_prediction(stock_name: str, historical_data: pd.DataFrame, 
                         model_dir: str = 'ml/models/') -> Dict:
    """
    Get prediction for a stock.
    
    Args:
        stock_name: Name of the stock (e.g., 'SFBT')
        historical_data: DataFrame with at least 60 days of OHLCV data
        model_dir: Path to model directory
    
    Returns:
        Prediction dictionary
    """
    predictor = BVMTPricePredictor(model_dir)
    return predictor.predict_from_history(stock_name, historical_data)


if __name__ == '__main__':
    # Test with sample data
    print("[TEST] Testing BVMTPricePredictor...")
    
    # Create sample historical data
    dates = pd.date_range(end=datetime.now(), periods=100, freq='B')
    sample_data = pd.DataFrame({
        'date': dates,
        'open': np.random.uniform(10, 12, 100),
        'high': np.random.uniform(11, 13, 100),
        'low': np.random.uniform(9, 11, 100),
        'close': np.random.uniform(10, 12, 100),
        'volume': np.random.randint(1000, 10000, 100),
        'transactions': np.random.randint(10, 100, 100)
    })
    
    # Test predictor (will fail gracefully if models not present)
    try:
        predictor = BVMTPricePredictor('models/')
        result = predictor.predict_from_history('SFBT', sample_data)
        print(json.dumps(result, indent=2))
    except Exception as e:
        print(f"[WARN] Test failed (expected if models not present): {e}")
