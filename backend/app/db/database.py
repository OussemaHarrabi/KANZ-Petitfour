"""Supabase PostgreSQL database setup with SQLModel."""

from datetime import datetime
from typing import Optional

from sqlmodel import Field, SQLModel, create_engine, Session, select

from app.core.config import DATABASE_URL


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    supabase_uid: str = Field(index=True, unique=True)
    email: str = Field(index=True, unique=True)
    role: str = "investor"
    full_name: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Stock(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    code: str = Field(index=True, unique=True)
    name: str
    groupe: int = 11


class PriceData(SQLModel, table=True):
    __tablename__ = "price_data"
    id: Optional[int] = Field(default=None, primary_key=True)
    stock_id: int = Field(foreign_key="stock.id", index=True)
    date: datetime = Field(index=True)
    open: float
    high: float
    low: float
    close: float
    volume: int
    transactions: int
    capital: float


class Portfolio(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    user_id: str = Field(index=True)
    stock_code: str
    quantity: int
    avg_buy_price: float
    created_at: datetime = Field(default_factory=datetime.utcnow)


class Alert(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    stock_code: str
    alert_type: str
    message: str
    severity: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    is_read: bool = False


class News(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    url: str = Field(unique=True)
    title: str
    content: Optional[str] = None
    date: Optional[datetime] = None
    source: str
    stock_code: Optional[str] = Field(default=None, index=True)
    language: str = "fr"
    sentiment_score: Optional[float] = None
    sentiment_label: Optional[str] = None
    sentiment_confidence: Optional[float] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)


engine = create_engine(DATABASE_URL, echo=False)


def create_db_and_tables() -> None:
    SQLModel.metadata.create_all(engine)


def get_session() -> Session:
    return Session(engine)


def is_data_loaded() -> bool:
    with Session(engine) as session:
        statement = select(Stock).limit(1)
        return session.exec(statement).first() is not None
