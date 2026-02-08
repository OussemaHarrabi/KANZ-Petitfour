"""Decision agent combining prediction, sentiment, and anomalies."""

from __future__ import annotations

from typing import Dict, List


def get_recommendation(
    stock_code: str,
    price_prediction: Dict,
    sentiment: Dict,
    anomalies: Dict,
) -> Dict:
    price_score = 0.0
    sentiment_score = sentiment.get("score", 0.0)
    anomaly_penalty = -0.2 if anomalies.get("severity") == "HIGH" else 0.0

    predictions = price_prediction.get("predictions", {})
    returns = [v.get("predicted_return_pct", 0.0) for v in predictions.values()]
    if returns:
        price_score = sum(returns) / len(returns) / 100

    technical_score = 0.0
    if price_prediction.get("recommendation", {}).get("action") == "BUY":
        technical_score = 0.2
    elif price_prediction.get("recommendation", {}).get("action") == "SELL":
        technical_score = -0.2

    combined = (
        0.4 * price_score
        + 0.3 * sentiment_score
        + 0.2 * technical_score
        + 0.1 * anomaly_penalty
    )

    action = "HOLD"
    if combined > 0.05:
        action = "BUY"
    elif combined < -0.05:
        action = "SELL"

    reasons: List[str] = []
    reasons.append(f"Prediction signal: {price_score:.2f}")
    reasons.append(f"Sentiment signal: {sentiment_score:.2f}")
    if anomaly_penalty < 0:
        reasons.append("High anomaly risk detected")

    confidence = min(abs(combined) * 5, 1.0)
    return {
        "action": action,
        "confidence": round(confidence, 2),
        "reasons": reasons,
    }
