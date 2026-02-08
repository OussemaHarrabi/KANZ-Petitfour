"""Investor profile endpoints for auto-detected behavior analysis."""

from __future__ import annotations

from fastapi import APIRouter

from app.services.investor_profile import get_investor_profile

router = APIRouter(prefix="/api/profile", tags=["profile"])


@router.get("")
def profile():
    """Get auto-detected investor profile based on behavior analysis.
    
    In demo mode, returns a simulated profile based on mock data.
    In production, would analyze real user trades, alerts, and simulations.
    """
    mock_trades = [
        {"timestamp": 1704067200, "hold_duration": 5, "pnl_pct": 3.2},
        {"timestamp": 1704326400, "hold_duration": 12, "pnl_pct": -2.1},
        {"timestamp": 1704672000, "hold_duration": 3, "pnl_pct": 5.5},
        {"timestamp": 1704931200, "hold_duration": 8, "pnl_pct": -4.2},
        {"timestamp": 1705190400, "hold_duration": 2, "pnl_pct": 7.1},
        {"timestamp": 1705449600, "hold_duration": 15, "pnl_pct": 1.8},
        {"timestamp": 1705708800, "hold_duration": 4, "pnl_pct": -1.5},
    ]
    
    mock_alerts = [
        {"type": "price", "stock": "BIAT"},
        {"type": "price", "stock": "SFBT"},
        {"type": "anomaly", "stock": "UIB"},
        {"type": "price", "stock": "ATB"},
    ]
    
    mock_simulations = [
        {"position_size_pct": 15, "volatility": 0.25},
        {"position_size_pct": 20, "volatility": 0.35},
        {"position_size_pct": 10, "volatility": 0.15},
        {"position_size_pct": 25, "volatility": 0.40},
    ]
    
    return get_investor_profile(
        trades=mock_trades,
        alerts=mock_alerts,
        simulations=mock_simulations,
    )


@router.post("/analyze")
def analyze_profile(
    trades: list = None,
    alerts: list = None,
    simulations: list = None,
):
    """Analyze custom behavior data to determine investor profile."""
    return get_investor_profile(
        trades=trades or [],
        alerts=alerts or [],
        simulations=simulations or [],
    )
