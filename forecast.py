import uuid

import pandas as pd
from fastapi import APIRouter, Depends

from app.core.auth import AuthContext, get_current_org
from app.core.config import get_supabase

router = APIRouter()

MODEL_VERSION = "baseline-moving-avg-v1"  # swap for "lightgbm-v1" once trained


@router.post("/run")
def run_forecast(horizon_weeks: int = 8, auth: AuthContext = Depends(get_current_org)):
    """
    MVP baseline: 4-week moving average carried forward as the forecast.
    Replace the `predict()` body with a trained LightGBM model per product
    once there's enough history (recommend >= 12 weeks of data).
    """
    supabase = get_supabase()
    sales = (
        supabase.table("sales")
        .select("product_id,date,quantity")
        .eq("org_id", auth.org_id)
        .execute()
    )
    if not sales.data:
        return {"forecast_run_id": None, "message": "No sales data yet"}

    df = pd.DataFrame(sales.data)
    df["date"] = pd.to_datetime(df["date"])

    forecast_run_id = str(uuid.uuid4())
    records = []
    last_date = df["date"].max()

    for product_id, group in df.groupby("product_id"):
        weekly = group.set_index("date")["quantity"].resample("W").sum()
        moving_avg = weekly.tail(4).mean() if len(weekly) else 0
        for w in range(1, horizon_weeks + 1):
            forecast_date = last_date + pd.Timedelta(weeks=w)
            records.append(
                {
                    "org_id": auth.org_id,
                    "product_id": product_id,
                    "date": forecast_date.strftime("%Y-%m-%d"),
                    "predicted_qty": float(moving_avg),
                    "model_version": MODEL_VERSION,
                    "forecast_run_id": forecast_run_id,
                }
            )

    batch_size = 500
    for i in range(0, len(records), batch_size):
        supabase.table("forecasts").insert(records[i : i + batch_size]).execute()

    return {"forecast_run_id": forecast_run_id, "rows_written": len(records)}
