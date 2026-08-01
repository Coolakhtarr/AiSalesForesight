"""
Cleans a raw uploaded sales CSV/XLSX into normalized DataFrames ready
to insert into the `products` and `sales` tables.

This is intentionally dependency-light (pandas only) so it's easy to
extend column-mapping heuristics as you see real-world files.
"""
from __future__ import annotations

import re
import pandas as pd

NON_PRODUCT_PATTERN = re.compile(r"(shipping|freight|tax|fee)", re.IGNORECASE)

REQUIRED_COLUMNS = ["date", "product_id", "product_name", "quantity_sold", "price"]


def load_raw_file(path: str) -> pd.DataFrame:
    if path.endswith(".csv"):
        return pd.read_csv(path)
    return pd.read_excel(path)


def clean_sales_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    df.columns = [c.strip().lower().replace(" ", "_") for c in df.columns]

    missing = [c for c in REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise ValueError(f"Missing required columns: {missing}")

    # Drop obvious non-product line items (shipping, tax, fees)
    df = df[~df["product_name"].astype(str).str.contains(NON_PRODUCT_PATTERN, na=False)]

    # Drop explicitly cancelled/refunded rows if a status column exists
    if "status" in df.columns:
        df = df[~df["status"].astype(str).str.lower().isin(["cancelled", "refunded", "void"])]

    # Fix dates
    df["date"] = pd.to_datetime(df["date"], errors="coerce")
    df = df.dropna(subset=["date"])

    # Drop duplicate order lines
    dedupe_cols = [c for c in ["order_id", "product_id", "date", "quantity_sold"] if c in df.columns]
    if dedupe_cols:
        df = df.drop_duplicates(subset=dedupe_cols)

    # Normalize product identifiers
    df["product_id"] = df["product_id"].astype(str).str.strip()
    df["product_name"] = df["product_name"].astype(str).str.strip()

    # Coerce numerics, drop invalid rows
    df["quantity_sold"] = pd.to_numeric(df["quantity_sold"], errors="coerce")
    df["price"] = pd.to_numeric(df["price"], errors="coerce")
    df = df.dropna(subset=["quantity_sold", "price"])
    df = df[(df["quantity_sold"] > 0) & (df["price"] >= 0)]

    if "location" not in df.columns:
        df["location"] = None
    if "discount_flag" not in df.columns:
        df["discount_flag"] = False

    return df.reset_index(drop=True)


def extract_products(clean_df: pd.DataFrame) -> pd.DataFrame:
    products = (
        clean_df[["product_id", "product_name"]]
        .drop_duplicates(subset=["product_id"])
        .rename(columns={"product_id": "external_product_id", "product_name": "name"})
    )
    return products.reset_index(drop=True)


def add_features(clean_df: pd.DataFrame) -> pd.DataFrame:
    """Adds lag / rolling-average features per product, sorted by date."""
    df = clean_df.sort_values(["product_id", "date"]).copy()
    grouped = df.groupby("product_id")["quantity_sold"]
    df["lag_7"] = grouped.shift(7)
    df["lag_28"] = grouped.shift(28)
    df["rolling_mean_4w"] = grouped.transform(lambda s: s.rolling(28, min_periods=1).mean())
    df["rolling_std_4w"] = grouped.transform(lambda s: s.rolling(28, min_periods=1).std())
    return df
