"""Load BVMT historical data into SQLite."""

from __future__ import annotations

from pathlib import Path
from typing import Dict, List, Tuple, cast

import pandas as pd
from sqlmodel import Session, select  # type: ignore[import-not-found]

from app.core.config import DATASET_DIR
from app.db.database import Stock, PriceData


EXPECTED_COLUMNS = [
    "SEANCE",
    "GROUPE",
    "CODE",
    "VALEUR",
    "OUVERTURE",
    "CLOTURE",
    "PLUS_BAS",
    "PLUS_HAUT",
    "QUANTITE_NEGOCIEE",
    "NB_TRANSACTION",
    "CAPITAUX",
]


def _read_legacy_txt(file_path: Path) -> pd.DataFrame:
    df = pd.read_csv(
        file_path,
        sep=r"\s+",
        header=None,
        names=EXPECTED_COLUMNS,
        engine="python",
        on_bad_lines="skip",
    )
    return df


def _read_csv(file_path: Path) -> pd.DataFrame:
    df = pd.read_csv(file_path, sep=";", encoding="utf-8")
    return df


def _normalize(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [col.strip().upper() for col in df.columns]
    missing = [col for col in EXPECTED_COLUMNS if col not in df.columns]
    if missing:
        raise ValueError(f"Missing columns: {missing}")

    df = df.loc[:, EXPECTED_COLUMNS]
    groupe_series = df["GROUPE"]
    if isinstance(groupe_series, pd.DataFrame):
        groupe_series = groupe_series.iloc[:, 0]
    df = df.loc[groupe_series.astype(str).str.strip() == "11"]

    df["SEANCE"] = pd.to_datetime(df["SEANCE"], format="%d/%m/%Y", errors="coerce")
    df = df.dropna(subset=["SEANCE", "CODE"]).copy()

    numeric_cols = [
        "OUVERTURE",
        "CLOTURE",
        "PLUS_BAS",
        "PLUS_HAUT",
        "QUANTITE_NEGOCIEE",
        "NB_TRANSACTION",
        "CAPITAUX",
    ]
    for col in numeric_cols:
        df[col] = (
            df[col]
            .astype(str)
            .str.replace(",", ".", regex=False)
            .str.replace(" ", "", regex=False)
        )
        df[col] = pd.to_numeric(df[col], errors="coerce")

    df = df.dropna(subset=["CLOTURE"]).copy()
    return df


def load_all_files(dataset_dir: Path = DATASET_DIR) -> pd.DataFrame:
    frames: List[pd.DataFrame] = []
    for file_path in sorted(dataset_dir.glob("histo_cotation_*.txt")):
        frames.append(_read_legacy_txt(file_path))
    for file_path in sorted(dataset_dir.glob("histo_cotation_*.csv")):
        frames.append(_read_csv(file_path))

    if not frames:
        return pd.DataFrame.from_records([], columns=EXPECTED_COLUMNS)

    combined = pd.concat(frames, ignore_index=True)
    return _normalize(combined)


def _get_or_create_stock(session: Session, code: str, name: str) -> Stock:
    statement = select(Stock).where(Stock.code == code)
    stock = session.exec(statement).first()
    if stock:
        if stock.name != name:
            stock.name = name
            session.add(stock)
        return stock
    stock = Stock(code=code, name=name, groupe=11)
    session.add(stock)
    session.flush()
    return stock


def load_data(session: Session, dataset_dir: Path = DATASET_DIR) -> Dict[str, int]:
    df = load_all_files(dataset_dir)
    if df.empty:
        return {"stocks": 0, "prices": 0}

    stock_count = 0
    price_count = 0

    grouped = df.groupby(["CODE", "VALEUR"], dropna=False)
    for key, group in grouped:
        code, name = cast(Tuple[str, str], key)
        stock = _get_or_create_stock(session, str(code).strip(), str(name).strip())
        if stock.id is None:
            session.flush()
        stock_id = stock.id or 0
        stock_count += 1

        records = []
        for _, row in group.iterrows():
            date_stamp = pd.Timestamp(str(row["SEANCE"]))
            if date_stamp is pd.NaT:
                continue
            date_value = date_stamp.to_pydatetime()
            records.append(
                PriceData(
                    stock_id=stock_id,
                    date=date_value,  # type: ignore[arg-type]
                    open=float(row["OUVERTURE"]),
                    high=float(row["PLUS_HAUT"]),
                    low=float(row["PLUS_BAS"]),
                    close=float(row["CLOTURE"]),
                    volume=int(row["QUANTITE_NEGOCIEE"] or 0),
                    transactions=int(row["NB_TRANSACTION"] or 0),
                    capital=float(row["CAPITAUX"] or 0.0),
                )
            )

        session.add_all(records)
        price_count += len(records)

    session.commit()
    return {"stocks": stock_count, "prices": price_count}
