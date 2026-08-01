from fastapi import APIRouter, Depends

from app.core.auth import AuthContext, get_current_org
from app.core.config import get_settings, get_supabase

router = APIRouter()


def send_whatsapp(to_number: str, body: str) -> bool:
    """
    Sends a WhatsApp message via Twilio's WhatsApp API. Requires a Twilio
    account with WhatsApp enabled (sandbox for testing, approved sender for
    production — Twilio's WhatsApp onboarding involves template approval
    for anything beyond a 24-hour reply window, budget a few days for that).
    """
    settings = get_settings()
    if not settings.TWILIO_ACCOUNT_SID:
        return False  # not configured — caller should treat as a no-op in dev
    from twilio.rest import Client

    client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)
    client.messages.create(from_=settings.TWILIO_WHATSAPP_FROM, to=f"whatsapp:{to_number}", body=body)
    return True


def send_email(to_email: str, subject: str, html_body: str) -> bool:
    """Sends an email via Resend. Swap for SendGrid/Postmark if preferred."""
    settings = get_settings()
    if not settings.RESEND_API_KEY:
        return False
    import resend

    resend.api_key = settings.RESEND_API_KEY
    resend.Emails.send(
        {"from": settings.RESEND_FROM_EMAIL, "to": to_email, "subject": subject, "html": html_body}
    )
    return True


@router.post("/reorder-alert/run")
def run_reorder_alert(auth: AuthContext = Depends(get_current_org)):
    """
    Sends a same-day WhatsApp alert listing today's 'reorder_now' products.
    Intended to run daily after the risk-scoring job (/insights/risk/run).
    """
    supabase = get_supabase()
    org = supabase.table("organizations").select("name,owner_whatsapp_number").eq("id", auth.org_id).single().execute()
    to_number = (org.data or {}).get("owner_whatsapp_number")

    risk = (
        supabase.table("inventory_insights")
        .select("product_id,products(name)")
        .eq("org_id", auth.org_id)
        .eq("status", "reorder_now")
        .execute()
    )
    if not risk.data:
        return {"message": "Nothing to alert — no products need reordering today"}

    product_names = [r["products"]["name"] for r in risk.data if r.get("products")]
    body = (
        f"AiSalesForesight: {len(product_names)} products need reordering today — "
        + ", ".join(product_names[:5])
        + (f" and {len(product_names) - 5} more." if len(product_names) > 5 else ".")
    )

    sent = send_whatsapp(to_number, body) if to_number else False

    supabase.table("notifications_log").insert(
        {
            "org_id": auth.org_id,
            "channel": "whatsapp",
            "kind": "reorder_alert",
            "recipient": to_number or "unconfigured",
            "payload_json": {"message": body, "product_count": len(product_names)},
            "status": "sent" if sent else "failed",
        }
    ).execute()

    return {"sent": sent, "products_flagged": len(product_names)}


@router.post("/weekly-digest/run")
def run_weekly_digest(recipient_email: str, auth: AuthContext = Depends(get_current_org)):
    """
    Sends a weekly summary email: revenue at risk, overstock value, and top
    3 insights from the last 7 days. Intended to run once a week via cron.
    """
    supabase = get_supabase()

    risk = supabase.table("inventory_insights").select("status,revenue_at_risk,capital_locked").eq(
        "org_id", auth.org_id
    ).execute()
    total_risk = sum(r.get("revenue_at_risk") or 0 for r in risk.data)
    total_overstock = sum(r.get("capital_locked") or 0 for r in risk.data if r["status"] == "overstock")

    recent_insights = (
        supabase.table("analytics_insights")
        .select("message")
        .eq("org_id", auth.org_id)
        .order("created_at", desc=True)
        .limit(3)
        .execute()
    )

    insights_html = "".join(f"<li>{i['message']}</li>" for i in recent_insights.data)
    html = f"""
    <h2>Your weekly AiSalesForesight summary</h2>
    <p><strong>Revenue at risk:</strong> ₹{total_risk:,.0f}</p>
    <p><strong>Capital in overstock:</strong> ₹{total_overstock:,.0f}</p>
    <h3>This week's top insights</h3>
    <ul>{insights_html}</ul>
    """

    sent = send_email(recipient_email, "Your weekly sales & inventory summary", html)

    supabase.table("notifications_log").insert(
        {
            "org_id": auth.org_id,
            "channel": "email",
            "kind": "weekly_digest",
            "recipient": recipient_email,
            "payload_json": {"total_risk": total_risk, "total_overstock": total_overstock},
            "status": "sent" if sent else "failed",
        }
    ).execute()

    return {"sent": sent}
