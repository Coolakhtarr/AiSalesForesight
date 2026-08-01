import pandas as pd
from fastapi import APIRouter, Depends

from app.core.auth import AuthContext, get_current_org
from app.core.config import get_supabase

router = APIRouter()

# These endpoints are intended to be called by Inngest scheduled functions
# (nightly / weekly / monthly), one org at a time, or fanned out across all
# active orgs. Each is a stub with a clear algorithm to implement next.


@router.post("/trends/run")
def run_trend_detection(auth: AuthContext = Depends(get_current_org)):
    """
    Compares last-4-week vs prior-8-week rolling mean per product.
    Flags significant % change as trend_up / trend_down.
    """
    supabase = get_supabase()
    sales = supabase.table("sales").select("product_id,date,quantity").eq(
        "org_id", auth.org_id
    ).execute()
    if not sales.data:
        return {"message": "No sales data"}

    df = pd.DataFrame(sales.data)
    df["date"] = pd.to_datetime(df["date"])
    last_date = df["date"].max()

    records = []
    for product_id, group in df.groupby("product_id"):
        weekly = group.set_index("date")["quantity"].resample("W").sum()
        recent_mean = weekly.tail(4).mean()
        prior_mean = weekly.iloc[-12:-4].mean() if len(weekly) >= 12 else None
        if not prior_mean or prior_mean == 0:
            continue
        pct_change = (recent_mean - prior_mean) / prior_mean
        if abs(pct_change) < 0.25:  # threshold for "significant"
            continue
        trend_type = "trend_up" if pct_change > 0 else "trend_down"
        records.append(
            {
                "org_id": auth.org_id,
                "type": trend_type,
                "product_id": product_id,
                "message": f"Demand {'rose' if pct_change > 0 else 'fell'} {abs(pct_change)*100:.0f}% vs the prior period.",
                "metrics_json": {"recent_mean": recent_mean, "prior_mean": prior_mean, "pct_change": pct_change},
            }
        )

    if records:
        supabase.table("analytics_insights").insert(records).execute()
    return {"insights_written": len(records)}


@router.post("/cannibalization/run")
def run_cannibalization(auth: AuthContext = Depends(get_current_org)):
    """
    Looks for pairs of products in the same category whose weekly sales move
    in opposite directions with a meaningful negative correlation — a sign
    that one product's rise may be coming at the other's expense rather than
    from genuine category growth. Correlation alone doesn't prove causation,
    so the message is phrased as a hypothesis worth checking, not a fact.
    """
    supabase = get_supabase()
    sales = (
        supabase.table("sales")
        .select("product_id,date,quantity")
        .eq("org_id", auth.org_id)
        .execute()
    )
    products = supabase.table("products").select("id,name,category").eq("org_id", auth.org_id).execute()
    if not sales.data or not products.data:
        return {"message": "No sales/product data"}

    category_map = {p["id"]: p.get("category") for p in products.data}
    name_map = {p["id"]: p["name"] for p in products.data}

    df = pd.DataFrame(sales.data)
    df["date"] = pd.to_datetime(df["date"])

    weekly_by_product = {}
    for product_id, group in df.groupby("product_id"):
        weekly = group.set_index("date")["quantity"].resample("W").sum()
        if len(weekly) >= 8:
            weekly_by_product[product_id] = weekly

    records = []
    checked_pairs = set()
    product_ids = list(weekly_by_product.keys())
    for i, pid_a in enumerate(product_ids):
        for pid_b in product_ids[i + 1 :]:
            if category_map.get(pid_a) != category_map.get(pid_b) or category_map.get(pid_a) is None:
                continue  # only compare within the same category
            pair_key = tuple(sorted([pid_a, pid_b]))
            if pair_key in checked_pairs:
                continue
            checked_pairs.add(pair_key)

            joined = pd.concat([weekly_by_product[pid_a], weekly_by_product[pid_b]], axis=1, join="inner")
            if len(joined) < 8:
                continue
            corr = joined.iloc[:, 0].corr(joined.iloc[:, 1])
            if corr is None or corr > -0.5:
                continue  # only flag meaningfully negative correlation

            name_a, name_b = name_map.get(pid_a, "Product A"), name_map.get(pid_b, "Product B")
            records.append(
                {
                    "org_id": auth.org_id,
                    "type": "cannibalization",
                    "product_id": pid_a,
                    "message": (
                        f"{name_a} and {name_b} tend to move in opposite directions week to week "
                        f"(correlation {corr:.2f}) — worth checking whether one is cannibalizing the other's demand."
                    ),
                    "metrics_json": {"related_product_id": pid_b, "correlation": float(corr)},
                }
            )

    if records:
        supabase.table("analytics_insights").insert(records).execute()
    return {"insights_written": len(records)}


@router.post("/festival-watch/run")
def run_festival_watch(auth: AuthContext = Depends(get_current_org)):
    """
    Checks upcoming festivals (next 21 days) against each product's sales
    in the same week last year. If a product spiked meaningfully around
    that festival last year, flags it as an early reorder reminder —
    this is the India-specific seasonal-demand feature: generic forecasting
    models miss lunar-calendar festivals entirely unless told about them.
    """
    supabase = get_supabase()
    today = pd.Timestamp.today().normalize()
    horizon = today + pd.Timedelta(days=21)

    upcoming = (
        supabase.table("calendar")
        .select("date,festival_name")
        .not_.is_("festival_name", "null")
        .gte("date", today.strftime("%Y-%m-%d"))
        .lte("date", horizon.strftime("%Y-%m-%d"))
        .execute()
    )
    if not upcoming.data:
        return {"message": "No festivals in the next 21 days"}

    sales = supabase.table("sales").select("product_id,date,quantity").eq("org_id", auth.org_id).execute()
    products = supabase.table("products").select("id,name").eq("org_id", auth.org_id).execute()
    name_map = {p["id"]: p["name"] for p in products.data}
    if not sales.data:
        return {"message": "No sales data"}

    df = pd.DataFrame(sales.data)
    df["date"] = pd.to_datetime(df["date"])

    records = []
    for festival in upcoming.data:
        festival_date = pd.Timestamp(festival["date"])
        last_year_window = df[
            (df["date"] >= festival_date - pd.Timedelta(days=372))
            & (df["date"] <= festival_date - pd.Timedelta(days=358))
        ]
        if last_year_window.empty:
            continue  # not enough history for this festival yet

        baseline = df[df["date"] < festival_date - pd.Timedelta(days=372)]
        for product_id, festival_group in last_year_window.groupby("product_id"):
            product_baseline = baseline[baseline["product_id"] == product_id]
            if product_baseline.empty:
                continue
            festival_daily_avg = festival_group["quantity"].sum() / 14
            baseline_daily_avg = product_baseline["quantity"].sum() / max(len(product_baseline["date"].dt.date.unique()), 1)
            if baseline_daily_avg == 0:
                continue
            spike_ratio = festival_daily_avg / baseline_daily_avg
            if spike_ratio < 1.5:
                continue  # only flag genuine festival spikes

            days_until = (festival_date - today).days
            name = name_map.get(product_id, "This product")
            records.append(
                {
                    "org_id": auth.org_id,
                    "type": "festival_watch",
                    "product_id": product_id,
                    "message": (
                        f"{festival['festival_name']} is in {days_until} days. {name} sold "
                        f"~{spike_ratio:.1f}x its normal daily volume around this festival last year — "
                        f"consider reordering ahead of the rush."
                    ),
                    "metrics_json": {
                        "festival_name": festival["festival_name"],
                        "festival_date": festival["date"],
                        "spike_ratio": float(spike_ratio),
                        "days_until": days_until,
                    },
                }
            )

    if records:
        supabase.table("analytics_insights").insert(records).execute()
    return {"insights_written": len(records)}


@router.post("/bundles/run")
def run_bundle_recommendations(auth: AuthContext = Depends(get_current_org)):
    """
    Simple market-basket analysis: for orders with an order_id, counts how
    often product pairs co-occur in the same order, and flags the strongest
    pairs as bundle/cross-sell candidates. Requires order_id to be populated
    on sales rows (optional column — falls back gracefully if absent).
    """
    from itertools import combinations
    from collections import Counter

    supabase = get_supabase()
    sales = supabase.table("sales").select("product_id,order_id").eq("org_id", auth.org_id).execute()
    if not sales.data:
        return {"message": "No sales data"}

    products = supabase.table("products").select("id,name").eq("org_id", auth.org_id).execute()
    name_map = {p["id"]: p["name"] for p in products.data}

    df = pd.DataFrame(sales.data).dropna(subset=["order_id"])
    if df.empty:
        return {"message": "No order_id data — bundle detection needs order_id populated on sales rows"}

    pair_counts: Counter = Counter()
    order_counts: Counter = Counter()
    for order_id, group in df.groupby("order_id"):
        unique_products = sorted(set(group["product_id"]))
        for pid in unique_products:
            order_counts[pid] += 1
        for a, b in combinations(unique_products, 2):
            pair_counts[(a, b)] += 1

    total_orders = df["order_id"].nunique()
    records = []
    for (a, b), co_count in pair_counts.most_common(20):
        support = co_count / total_orders
        if support < 0.03 or co_count < 5:
            continue  # too rare to be a reliable recommendation
        name_a, name_b = name_map.get(a, "Product A"), name_map.get(b, "Product B")
        records.append(
            {
                "org_id": auth.org_id,
                "type": "bundle",
                "product_id": a,
                "message": (
                    f"{name_a} and {name_b} are bought together in {support*100:.0f}% of orders "
                    f"that include either — consider bundling them or placing them near each other."
                ),
                "metrics_json": {"related_product_id": b, "co_occurrence_count": co_count, "support": support},
            }
        )

    if records:
        supabase.table("analytics_insights").insert(records).execute()
    return {"insights_written": len(records)}
def run_promo_impact(auth: AuthContext = Depends(get_current_org)):
    """
    Compares average weekly margin (or revenue, if unit_cost is missing)
    during discount_flag=True periods vs non-discount periods, per product.
    Flags promotions that grew revenue but shrank margin, and ones that
    genuinely grew both.
    """
    supabase = get_supabase()
    sales = (
        supabase.table("sales")
        .select("product_id,date,quantity,price,discount_flag")
        .eq("org_id", auth.org_id)
        .execute()
    )
    if not sales.data:
        return {"message": "No sales data"}

    products = supabase.table("products").select("id,name,unit_cost").eq("org_id", auth.org_id).execute()
    cost_map = {p["id"]: p.get("unit_cost") for p in products.data}
    name_map = {p["id"]: p["name"] for p in products.data}

    df = pd.DataFrame(sales.data)
    df["date"] = pd.to_datetime(df["date"])

    records = []
    for product_id, group in df.groupby("product_id"):
        promo = group[group["discount_flag"] == True]
        non_promo = group[group["discount_flag"] == False]
        if promo.empty or non_promo.empty:
            continue  # need both conditions present to compare

        unit_cost = cost_map.get(product_id)

        def weekly_avg_margin(g: pd.DataFrame) -> float:
            weekly = g.set_index("date")
            if unit_cost is not None:
                weekly["margin"] = weekly["quantity"] * (weekly["price"] - unit_cost)
                metric = weekly["margin"].resample("W").sum()
            else:
                weekly["revenue"] = weekly["quantity"] * weekly["price"]
                metric = weekly["revenue"].resample("W").sum()
            return metric.mean() if len(metric) else 0

        promo_metric = weekly_avg_margin(promo)
        non_promo_metric = weekly_avg_margin(non_promo)
        if non_promo_metric == 0:
            continue
        pct_change = (promo_metric - non_promo_metric) / abs(non_promo_metric)
        label = "margin" if unit_cost is not None else "revenue"

        if pct_change > 0.1:
            message = f"Promotions on this product increased average weekly {label} by {pct_change*100:.0f}%."
        elif pct_change < -0.1:
            message = f"Promotions on this product decreased average weekly {label} by {abs(pct_change)*100:.0f}% despite any unit-volume gains."
        else:
            message = f"Promotions on this product had little net effect on {label} ({pct_change*100:+.0f}%)."

        records.append(
            {
                "org_id": auth.org_id,
                "type": "promo_impact",
                "product_id": product_id,
                "message": message,
                "metrics_json": {
                    "metric": label,
                    "promo_avg": promo_metric,
                    "non_promo_avg": non_promo_metric,
                    "pct_change": pct_change,
                },
            }
        )

    if records:
        supabase.table("analytics_insights").insert(records).execute()
    return {"insights_written": len(records)}


@router.post("/elasticity/run")
def run_elasticity(auth: AuthContext = Depends(get_current_org)):
    """
    Approximates price elasticity of demand per product via a log-log
    regression: log(quantity) ~ a + b*log(price), aggregated to weekly
    price/quantity pairs. The slope b is the elasticity estimate:
      b < -1   -> elastic (demand very sensitive to price; be cautious raising price)
      -1 < b < 0 -> inelastic (demand fairly stable; some room to raise price)
      b >= 0   -> unreliable signal / insufficient variation, skip
    Requires at least 3 distinct weekly price points to fit a meaningful line.
    """
    import numpy as np

    supabase = get_supabase()
    sales = (
        supabase.table("sales")
        .select("product_id,date,quantity,price")
        .eq("org_id", auth.org_id)
        .execute()
    )
    if not sales.data:
        return {"message": "No sales data"}

    products = supabase.table("products").select("id,name").eq("org_id", auth.org_id).execute()
    name_map = {p["id"]: p["name"] for p in products.data}

    df = pd.DataFrame(sales.data)
    df["date"] = pd.to_datetime(df["date"])

    records = []
    for product_id, group in df.groupby("product_id"):
        weekly = group.set_index("date").resample("W").agg({"quantity": "sum", "price": "mean"}).dropna()
        weekly = weekly[(weekly["quantity"] > 0) & (weekly["price"] > 0)]
        if weekly["price"].nunique() < 3:
            continue  # not enough price variation to trust a regression

        log_price = np.log(weekly["price"])
        log_qty = np.log(weekly["quantity"])
        slope, intercept = np.polyfit(log_price, log_qty, 1)

        if slope >= 0:
            continue  # non-negative slope is not an economically meaningful elasticity here

        if slope < -1:
            interpretation = "Demand is quite sensitive to price — raising price would likely reduce total revenue."
        else:
            interpretation = "Demand is relatively stable across the prices you've charged — there may be room to raise price without losing much volume."

        latest_price = float(weekly["price"].iloc[-1])
        latest_qty = float(weekly["quantity"].iloc[-1])

        records.append(
            {
                "org_id": auth.org_id,
                "type": "elasticity",
                "product_id": product_id,
                "message": f"Estimated price elasticity is {slope:.2f}. {interpretation}",
                "metrics_json": {
                    "elasticity": float(slope),
                    "price": latest_price,
                    "quantity": latest_qty,
                    "weeks_used": int(len(weekly)),
                },
            }
        )

    if records:
        supabase.table("analytics_insights").insert(records).execute()
    return {"insights_written": len(records)}


@router.post("/rebalance/run")
def run_rebalance(auth: AuthContext = Depends(get_current_org)):
    """
    For products sold across multiple locations, compares each location's
    average daily demand against its current stock (in days-of-cover) and
    suggests moving units from locations with excess cover to locations
    running low — before recommending a new purchase order.
    """
    supabase = get_supabase()
    sales = (
        supabase.table("sales")
        .select("product_id,date,quantity,location")
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
        return {"message": "Need both sales and inventory data"}

    products = supabase.table("products").select("id,name").eq("org_id", auth.org_id).execute()
    name_map = {p["id"]: p["name"] for p in products.data}

    sales_df = pd.DataFrame(sales.data).dropna(subset=["location"])
    stock_df = pd.DataFrame(stock.data).dropna(subset=["location"])
    if sales_df.empty or stock_df.empty:
        return {"message": "No multi-location data found — rebalancing needs a `location` value on sales and inventory rows"}

    sales_df["date"] = pd.to_datetime(sales_df["date"])
    cutoff = sales_df["date"].max() - pd.Timedelta(days=60)
    recent = sales_df[sales_df["date"] >= cutoff]

    stock_df["date"] = pd.to_datetime(stock_df["date"])
    latest_stock = stock_df.sort_values("date").groupby(["product_id", "location"]).tail(1)

    records = []
    for product_id, group in recent.groupby("product_id"):
        by_location = group.groupby("location")["quantity"].sum() / 60  # avg daily demand per location
        product_stock = latest_stock[latest_stock["product_id"] == product_id].set_index("location")["stock_qty"]
        if len(by_location) < 2 or len(product_stock) < 2:
            continue  # need at least 2 locations to rebalance between

        cover_days = {}
        for loc in set(by_location.index) & set(product_stock.index):
            demand = by_location.get(loc, 0)
            stock_qty = product_stock.get(loc, 0)
            cover_days[loc] = stock_qty / demand if demand > 0 else float("inf")

        if len(cover_days) < 2:
            continue

        surplus_loc = max(cover_days, key=cover_days.get)
        deficit_loc = min(cover_days, key=cover_days.get)
        if surplus_loc == deficit_loc or cover_days[surplus_loc] < 20 or cover_days[deficit_loc] > 10:
            continue  # only flag genuinely imbalanced cases

        transfer_qty = round(
            (product_stock[surplus_loc] - product_stock[deficit_loc]) / 2
        )
        if transfer_qty <= 0:
            continue

        name = name_map.get(product_id, "This product")
        records.append(
            {
                "org_id": auth.org_id,
                "type": "rebalance",
                "product_id": product_id,
                "message": (
                    f"{name} has {cover_days[surplus_loc]:.0f} days of cover at {surplus_loc} but only "
                    f"{cover_days[deficit_loc]:.0f} at {deficit_loc}. Consider transferring ~{transfer_qty} units "
                    f"from {surplus_loc} to {deficit_loc} instead of placing a new order."
                ),
                "metrics_json": {
                    "surplus_location": surplus_loc,
                    "deficit_location": deficit_loc,
                    "surplus_cover_days": cover_days[surplus_loc],
                    "deficit_cover_days": cover_days[deficit_loc],
                    "suggested_transfer_qty": transfer_qty,
                },
            }
        )

    if records:
        supabase.table("analytics_insights").insert(records).execute()
    return {"insights_written": len(records)}


@router.post("/hidden-gems/run")
def run_hidden_gems(auth: AuthContext = Depends(get_current_org)):
    """
    Flags products with: (a) steady demand (low coefficient of variation
    week to week), (b) margin at or above the org median, and (c) total
    sales volume rank outside the top 20% — i.e. reliable earners that
    aren't the obvious bestsellers and may deserve more promotion/shelf space.
    """
    supabase = get_supabase()
    sales = (
        supabase.table("sales")
        .select("product_id,date,quantity,price")
        .eq("org_id", auth.org_id)
        .execute()
    )
    if not sales.data:
        return {"message": "No sales data"}

    products = supabase.table("products").select("id,name,unit_cost").eq("org_id", auth.org_id).execute()
    cost_map = {p["id"]: p.get("unit_cost") for p in products.data}
    name_map = {p["id"]: p["name"] for p in products.data}

    df = pd.DataFrame(sales.data)
    df["date"] = pd.to_datetime(df["date"])

    per_product = []
    for product_id, group in df.groupby("product_id"):
        weekly = group.set_index("date")["quantity"].resample("W").sum()
        if len(weekly) < 6 or weekly.mean() == 0:
            continue
        cv = weekly.std() / weekly.mean()  # coefficient of variation: lower = steadier
        total_qty = group["quantity"].sum()
        avg_price = group["price"].mean()
        unit_cost = cost_map.get(product_id)
        margin_per_unit = (avg_price - unit_cost) if unit_cost is not None else avg_price
        per_product.append(
            {"product_id": product_id, "cv": cv, "total_qty": total_qty, "margin_per_unit": margin_per_unit}
        )

    if len(per_product) < 5:
        return {"message": "Need at least 5 products with sufficient history to compare"}

    stats_df = pd.DataFrame(per_product)
    median_margin = stats_df["margin_per_unit"].median()
    top20_cutoff = stats_df["total_qty"].quantile(0.8)
    steady_cutoff = stats_df["cv"].quantile(0.4)  # bottom 40% most-steady demand

    candidates = stats_df[
        (stats_df["cv"] <= steady_cutoff)
        & (stats_df["margin_per_unit"] >= median_margin)
        & (stats_df["total_qty"] < top20_cutoff)
    ]

    records = []
    for _, row in candidates.iterrows():
        name = name_map.get(row["product_id"], "This product")
        records.append(
            {
                "org_id": auth.org_id,
                "type": "hidden_gem",
                "product_id": row["product_id"],
                "message": (
                    f"{name} sells steadily week to week with above-average margin, but isn't one of "
                    f"your top sellers — it may be worth more promotion or better shelf placement."
                ),
                "metrics_json": {
                    "demand_steadiness_cv": float(row["cv"]),
                    "margin_per_unit": float(row["margin_per_unit"]),
                    "total_qty": float(row["total_qty"]),
                },
            }
        )

    if records:
        supabase.table("analytics_insights").insert(records).execute()
    return {"insights_written": len(records)}
