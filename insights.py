import math

import pandas as pd
from fastapi import APIRouter, Depends

from app.core.auth import AuthContext, get_current_org
from app.core.config import get_supabase

router = APIRouter()

Z_SCORE_95 = 1.65


@router.post("/risk/run")
def run_inventory_risk(auth: AuthContext = Depends(get_current_org)):
    """
    Rules-based inventory risk classifier. Uses trailing 90 days of sales
    to estimate daily demand + variability, combines with the org's default
    lead time to compute reorder point / safety stock, and compares against
    the latest inventory snapshot per product.
    """
    supabase = get_supabase()

    org = supabase.table("organizations").select("default_lead_time_days").eq(
        "id", auth.org_id
    ).single().execute()
    lead_time_days = (org.data or {}).get("default_lead_time_days", 14)

    sales = (
        supabase.table("sales")
        .select("product_id,date,quantity,price")
        .eq("org_id", auth.org_id)
        .execute()
    )
    stock = (
        supabase.table("inventory_snapshots")
        .select("product_id,date,stock_qty,location")
        .eq("org_id", auth.org_id)
        .execute()
    )
    if not sales.data or not stock.data:
        return {"message": "Need both sales and inventory data to compute risk"}

    sales_df = pd.DataFrame(sales.data)
    sales_df["date"] = pd.to_datetime(sales_df["date"])
    cutoff = sales_df["date"].max() - pd.Timedelta(days=90)
    recent = sales_df[sales_df["date"] >= cutoff]

    stock_df = pd.DataFrame(stock.data)
    stock_df["date"] = pd.to_datetime(stock_df["date"])
    latest_stock = stock_df.sort_values("date").groupby("product_id").tail(1)

    records = []
    for product_id, group in recent.groupby("product_id"):
        daily = group.groupby(group["date"].dt.date)["quantity"].sum()
        avg_daily_demand = daily.mean() if len(daily) else 0
        demand_std = daily.std() if len(daily) > 1 else 0
        avg_price = group["price"].mean()

        reorder_point = avg_daily_demand * lead_time_days + Z_SCORE_95 * demand_std * math.sqrt(
            lead_time_days
        )
        safety_stock = max(reorder_point - avg_daily_demand * lead_time_days, 0)

        stock_row = latest_stock[latest_stock["product_id"] == product_id]
        current_stock = float(stock_row["stock_qty"].iloc[0]) if not stock_row.empty else 0
        location = stock_row["location"].iloc[0] if not stock_row.empty else None

        healthy_upper = reorder_point * 1.2
        overstock_threshold = 2 * (avg_daily_demand * lead_time_days)

        if current_stock <= reorder_point:
            status = "reorder_now"
        elif current_stock <= healthy_upper:
            status = "at_risk"
        elif current_stock > overstock_threshold:
            status = "overstock"
        else:
            status = "healthy"

        stockout_days_at_risk = max(0, lead_time_days - (current_stock / avg_daily_demand)) if avg_daily_demand else 0
        revenue_at_risk = stockout_days_at_risk * avg_daily_demand * avg_price
        capital_locked = (
            max(0, current_stock - overstock_threshold) * avg_price if status == "overstock" else 0
        )

        records.append(
            {
                "org_id": auth.org_id,
                "product_id": product_id,
                "location": location,
                "status": status,
                "avg_daily_demand": float(avg_daily_demand),
                "demand_std": float(demand_std),
                "reorder_point": float(reorder_point),
                "safety_stock": float(safety_stock),
                "revenue_at_risk": float(revenue_at_risk),
                "capital_locked": float(capital_locked),
            }
        )

    if records:
        # Clear old computed rows for this org, then insert fresh ones
        supabase.table("inventory_insights").delete().eq("org_id", auth.org_id).execute()
        supabase.table("inventory_insights").insert(records).execute()

    return {"products_scored": len(records)}
