"""Portfolio endpoints."""

from __future__ import annotations

from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlmodel import Session, select

from app.core.auth import get_current_user
from app.db.database import Portfolio, PriceData, Stock, User, get_session
from app.models.schemas import PortfolioTradeRequest

router = APIRouter(prefix="/api/portfolio", tags=["portfolio"])


def _latest_close(session: Session, stock_code: str):
    stock = session.exec(select(Stock).where(Stock.code == stock_code)).first()
    if not stock:
        return None
    latest = session.exec(
        select(PriceData)
        .where(PriceData.stock_id == stock.id)
        .order_by(PriceData.date.desc())
        .limit(1)
    ).first()
    return latest.close if latest else None


@router.get("")
def portfolio(
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    positions = session.exec(
        select(Portfolio).where(Portfolio.user_id == current_user.supabase_uid)
    ).all()
    results = []
    for position in positions:
        current_price = _latest_close(session, position.stock_code)
        current_value = current_price * position.quantity if current_price else None
        results.append(
            {
                "id": position.id,
                "user_id": position.user_id,
                "stock_code": position.stock_code,
                "quantity": position.quantity,
                "avg_buy_price": position.avg_buy_price,
                "created_at": position.created_at,
                "current_price": current_price,
                "current_value": current_value,
            }
        )
    return results


@router.post("/buy")
def buy_stock(
    request: PortfolioTradeRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    position = Portfolio(
        user_id=current_user.supabase_uid,
        stock_code=request.stock_code,
        quantity=request.quantity,
        avg_buy_price=request.price,
        created_at=datetime.utcnow(),
    )
    session.add(position)
    session.commit()
    session.refresh(position)
    return {"status": "ok", "position_id": position.id}


@router.post("/sell")
def sell_stock(
    request: PortfolioTradeRequest,
    current_user: User = Depends(get_current_user),
    session: Session = Depends(get_session),
):
    position = session.exec(
        select(Portfolio)
        .where(Portfolio.stock_code == request.stock_code)
        .where(Portfolio.user_id == current_user.supabase_uid)
        .order_by(Portfolio.created_at.asc())
    ).first()
    if not position:
        raise HTTPException(status_code=404, detail="Position not found")
    if position.quantity < request.quantity:
        raise HTTPException(status_code=400, detail="Insufficient quantity")
    position.quantity -= request.quantity
    if position.quantity == 0:
        session.delete(position)
    else:
        session.add(position)
    session.commit()
    return {"status": "ok"}
