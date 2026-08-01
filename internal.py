"""
Every other router in this service authenticates via a per-user Supabase
JWT (see app/core/auth.py) — correct for anything a logged-in person
triggers from the app. Scheduled jobs are different: nothing is logged in,
and a job needs to run once per organization, not once per request.

This router exists so a $0 scheduler (GitHub Actions cron, in this repo's
setup — see .github/workflows/scheduled-jobs.yml) can trigger every job for
every org with a single authenticated call, without needing per-user
credentials. It reuses the exact same job functions the per-user routes
use — each one already accepts an `auth: AuthContext` parameter, so we just
construct that context manually per org instead of resolving it from a JWT.
"""
from fastapi import APIRouter, Depends, Header, HTTPException, status

from app.core.auth import AuthContext
from app.core.config import get_settings, get_supabase
from app.routers import insights, forecast, jobs as analytics_jobs, notifications

router = APIRouter()


def verify_internal_secret(x_internal_secret: str = Header(...)) -> None:
    settings = get_settings()
    if not settings.INTERNAL_JOBS_SECRET or x_internal_secret != settings.INTERNAL_JOBS_SECRET:
        raise HTTPException(status.HTTP_401_UNAUTHORIZED, "Invalid internal secret")


def get_all_org_ids() -> list[str]:
    supabase = get_supabase()
    orgs = supabase.table("organizations").select("id").execute()
    return [o["id"] for o in orgs.data]


# Jobs grouped by how often they're worth running — matches the cron
# schedule in .github/workflows/scheduled-jobs.yml. Daily jobs are cheap
# and time-sensitive (stock risk changes fast); weekly jobs are heavier
# statistical scans that don't need to run more often than that.
DAILY_JOBS = [insights.run_inventory_risk, forecast.run_forecast]
WEEKLY_JOBS = [
    analytics_jobs.run_trend_detection,
    analytics_jobs.run_cannibalization,
    analytics_jobs.run_promo_impact,
    analytics_jobs.run_elasticity,
    analytics_jobs.run_rebalance,
    analytics_jobs.run_hidden_gems,
    analytics_jobs.run_bundle_recommendations,
    analytics_jobs.run_festival_watch,
]


@router.post("/run-daily-jobs", dependencies=[Depends(verify_internal_secret)])
def run_daily_jobs():
    org_ids = get_all_org_ids()
    results = {}
    for org_id in org_ids:
        auth = AuthContext(user_id="system", org_id=org_id)
        org_results = {}
        for job_fn in DAILY_JOBS:
            try:
                org_results[job_fn.__name__] = job_fn(auth=auth)
            except Exception as e:
                org_results[job_fn.__name__] = {"error": str(e)}
        results[org_id] = org_results
    return {"orgs_processed": len(org_ids), "results": results}


@router.post("/run-weekly-jobs", dependencies=[Depends(verify_internal_secret)])
def run_weekly_jobs():
    org_ids = get_all_org_ids()
    results = {}
    for org_id in org_ids:
        auth = AuthContext(user_id="system", org_id=org_id)
        org_results = {}
        for job_fn in WEEKLY_JOBS:
            try:
                org_results[job_fn.__name__] = job_fn(auth=auth)
            except Exception as e:
                org_results[job_fn.__name__] = {"error": str(e)}
        results[org_id] = org_results
    return {"orgs_processed": len(org_ids), "results": results}


@router.post("/run-weekly-digest", dependencies=[Depends(verify_internal_secret)])
def run_weekly_digest_all():
    """
    Sends the weekly email digest to every org that has a digest_email set.
    Skips orgs without one rather than failing the whole batch.
    """
    supabase = get_supabase()
    orgs = supabase.table("organizations").select("id,digest_email").execute()
    sent_count = 0
    for org in orgs.data:
        if not org.get("digest_email"):
            continue
        auth = AuthContext(user_id="system", org_id=org["id"])
        try:
            notifications.run_weekly_digest(recipient_email=org["digest_email"], auth=auth)
            sent_count += 1
        except Exception:
            continue
    return {"digests_sent": sent_count}
