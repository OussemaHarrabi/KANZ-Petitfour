"""Investor behavior profiler - auto-detects risk profile from user actions."""

from __future__ import annotations

from dataclasses import dataclass
from typing import Dict, List, Optional
from enum import Enum


class RiskProfile(str, Enum):
    CONSERVATIVE = "conservative"
    MODERATE = "moderate"
    AGGRESSIVE = "aggressive"


@dataclass
class BehaviorMetrics:
    trade_frequency: float
    avg_hold_duration_days: float
    loss_tolerance_pct: float
    volatility_preference: float
    alert_sensitivity: float
    simulation_risk_taking: float


class InvestorProfiler:
    
    PROFILE_THRESHOLDS = {
        RiskProfile.AGGRESSIVE: {
            "trade_frequency_min": 5.0,
            "hold_duration_max": 7.0,
            "loss_tolerance_min": 15.0,
            "volatility_pref_min": 0.6,
        },
        RiskProfile.CONSERVATIVE: {
            "trade_frequency_max": 2.0,
            "hold_duration_min": 30.0,
            "loss_tolerance_max": 5.0,
            "volatility_pref_max": 0.3,
        },
    }

    def analyze_trades(self, trades: List[Dict]) -> Dict:
        if not trades:
            return {"frequency": 0.0, "avg_hold": 0.0, "avg_loss_tolerance": 10.0}

        total_trades = len(trades)
        if total_trades < 2:
            return {"frequency": 1.0, "avg_hold": 14.0, "avg_loss_tolerance": 10.0}

        first_trade = trades[0].get("timestamp", 0)
        last_trade = trades[-1].get("timestamp", 0)
        days_active = max((last_trade - first_trade) / 86400, 1)
        frequency = total_trades / days_active * 7

        hold_durations = []
        loss_tolerances = []

        for trade in trades:
            if trade.get("hold_duration"):
                hold_durations.append(trade["hold_duration"])
            if trade.get("pnl_pct") and trade["pnl_pct"] < 0:
                loss_tolerances.append(abs(trade["pnl_pct"]))

        avg_hold = sum(hold_durations) / len(hold_durations) if hold_durations else 14.0
        avg_loss = sum(loss_tolerances) / len(loss_tolerances) if loss_tolerances else 10.0

        return {"frequency": frequency, "avg_hold": avg_hold, "avg_loss_tolerance": avg_loss}

    def analyze_alerts(self, alerts: List[Dict]) -> Dict:
        if not alerts:
            return {"sensitivity": 0.5, "types": []}

        price_alerts = sum(1 for a in alerts if a.get("type") == "price")
        anomaly_alerts = sum(1 for a in alerts if a.get("type") == "anomaly")
        total = len(alerts)

        sensitivity = 0.5
        if total > 10:
            sensitivity = 0.8
        elif total > 5:
            sensitivity = 0.6
        elif total < 2:
            sensitivity = 0.3

        return {
            "sensitivity": sensitivity,
            "price_alert_ratio": price_alerts / total if total else 0,
            "anomaly_focus": anomaly_alerts / total if total else 0,
        }

    def analyze_simulations(self, sim_trades: List[Dict]) -> Dict:
        if not sim_trades:
            return {"risk_taking": 0.5, "avg_position_size": 0.1}

        position_sizes = [t.get("position_size_pct", 10) for t in sim_trades]
        avg_position = sum(position_sizes) / len(position_sizes)

        volatile_picks = sum(1 for t in sim_trades if t.get("volatility", 0) > 0.3)
        risk_ratio = volatile_picks / len(sim_trades) if sim_trades else 0.5

        risk_taking = 0.5
        if avg_position > 20 and risk_ratio > 0.5:
            risk_taking = 0.8
        elif avg_position < 10 and risk_ratio < 0.3:
            risk_taking = 0.2
        else:
            risk_taking = 0.3 + (avg_position / 100) + (risk_ratio * 0.3)

        return {"risk_taking": min(risk_taking, 1.0), "avg_position_size": avg_position / 100}

    def calculate_profile(self, metrics: BehaviorMetrics) -> Dict:
        aggressive_score = 0.0
        conservative_score = 0.0

        if metrics.trade_frequency >= 5:
            aggressive_score += 0.25
        elif metrics.trade_frequency <= 2:
            conservative_score += 0.25

        if metrics.avg_hold_duration_days <= 7:
            aggressive_score += 0.2
        elif metrics.avg_hold_duration_days >= 30:
            conservative_score += 0.2

        if metrics.loss_tolerance_pct >= 15:
            aggressive_score += 0.2
        elif metrics.loss_tolerance_pct <= 5:
            conservative_score += 0.2

        if metrics.volatility_preference >= 0.6:
            aggressive_score += 0.15
        elif metrics.volatility_preference <= 0.3:
            conservative_score += 0.15

        aggressive_score += metrics.simulation_risk_taking * 0.2

        if aggressive_score > conservative_score + 0.2:
            profile = RiskProfile.AGGRESSIVE
            confidence = min(aggressive_score + 0.3, 1.0)
        elif conservative_score > aggressive_score + 0.2:
            profile = RiskProfile.CONSERVATIVE
            confidence = min(conservative_score + 0.3, 1.0)
        else:
            profile = RiskProfile.MODERATE
            confidence = 0.6 + abs(aggressive_score - conservative_score)

        return {
            "profile": profile.value,
            "confidence": round(confidence, 2),
            "scores": {
                "aggressive": round(aggressive_score, 2),
                "conservative": round(conservative_score, 2),
            },
        }

    def get_profile(
        self,
        trades: Optional[List[Dict]] = None,
        alerts: Optional[List[Dict]] = None,
        simulations: Optional[List[Dict]] = None,
    ) -> Dict:
        trade_analysis = self.analyze_trades(trades or [])
        alert_analysis = self.analyze_alerts(alerts or [])
        sim_analysis = self.analyze_simulations(simulations or [])

        metrics = BehaviorMetrics(
            trade_frequency=trade_analysis["frequency"],
            avg_hold_duration_days=trade_analysis["avg_hold"],
            loss_tolerance_pct=trade_analysis["avg_loss_tolerance"],
            volatility_preference=sim_analysis.get("avg_position_size", 0.1) * 3,
            alert_sensitivity=alert_analysis["sensitivity"],
            simulation_risk_taking=sim_analysis["risk_taking"],
        )

        result = self.calculate_profile(metrics)
        result["metrics"] = {
            "trade_frequency_per_week": round(metrics.trade_frequency, 1),
            "avg_hold_days": round(metrics.avg_hold_duration_days, 1),
            "loss_tolerance_pct": round(metrics.loss_tolerance_pct, 1),
            "volatility_preference": round(metrics.volatility_preference, 2),
            "alert_sensitivity": round(metrics.alert_sensitivity, 2),
            "simulation_risk_score": round(metrics.simulation_risk_taking, 2),
        }

        result["recommendations"] = self._get_recommendations(result["profile"])
        
        return result

    def _get_recommendations(self, profile: str) -> List[str]:
        recommendations = {
            "conservative": [
                "Focus sur les valeurs bancaires stables (BIAT, BNA)",
                "Privilegier les actions a dividendes reguliers",
                "Limiter l'exposition aux petites capitalisations",
                "Utiliser des ordres stop-loss serres",
            ],
            "moderate": [
                "Diversifier entre secteurs defensifs et cycliques",
                "Equilibrer entre croissance et revenus",
                "Surveiller les opportunites sur les mid-caps",
                "Ajuster la strategie selon les conditions du marche",
            ],
            "aggressive": [
                "Explorer les opportunites de trading court terme",
                "Surveiller les anomalies pour des entrees rapides",
                "Considerer les secteurs a forte croissance",
                "Utiliser le simulateur pour tester des strategies audacieuses",
            ],
        }
        return recommendations.get(profile, recommendations["moderate"])


investor_profiler = InvestorProfiler()


def get_investor_profile(
    trades: Optional[List[Dict]] = None,
    alerts: Optional[List[Dict]] = None,
    simulations: Optional[List[Dict]] = None,
) -> Dict:
    return investor_profiler.get_profile(trades, alerts, simulations)
