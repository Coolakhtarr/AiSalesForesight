import json
import uuid

import anthropic
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.core.auth import AuthContext, get_current_org
from app.core.config import get_settings, get_supabase

router = APIRouter()


class ChatRequest(BaseModel):
    message: str
    session_id: str | None = None


SYSTEM_PROMPT = """You are AiSalesForesight's business analyst. Answer using ONLY
the DATA CONTEXT provided below. If something isn't in the data, say you don't
have enough information rather than guessing. Speak in plain, non-technical
business language, and name specific products and numbers from the data where
relevant. Keep answers concise and action-oriented."""


def build_context(supabase, org_id: str) -> dict:
    risk = (
        supabase.table("inventory_insights")
        .select("product_id,status,revenue_at_risk,capital_locked")
        .eq("org_id", org_id)
        .order("revenue_at_risk", desc=True)
        .limit(10)
        .execute()
    )
    recent_insights = (
        supabase.table("analytics_insights")
        .select("type,message,metrics_json,created_at")
        .eq("org_id", org_id)
        .order("created_at", desc=True)
        .limit(15)
        .execute()
    )
    total_risk = sum(r.get("revenue_at_risk") or 0 for r in risk.data)
    total_overstock = sum(r.get("capital_locked") or 0 for r in risk.data)

    return {
        "kpi_summary": {
            "total_revenue_at_risk": total_risk,
            "total_capital_in_overstock": total_overstock,
        },
        "top_risk_products": risk.data,
        "recent_insights": recent_insights.data,
    }


def get_conversation_history(supabase, session_id: str, org_id: str, limit: int = 10) -> list[dict]:
    """
    Pulls prior turns for this session so the assistant has real multi-turn
    memory (e.g. "what about last month?" following an earlier question).
    Capped at the most recent `limit` messages to keep token usage bounded —
    older turns are dropped rather than summarized, which is fine here since
    each turn re-fetches live data context anyway.
    """
    history = (
        supabase.table("chat_messages")
        .select("role,content")
        .eq("session_id", session_id)
        .eq("org_id", org_id)
        .order("created_at")
        .limit(limit)
        .execute()
    )
    return [{"role": m["role"], "content": m["content"]} for m in history.data]


@router.post("/")
def chat(req: ChatRequest, auth: AuthContext = Depends(get_current_org)):
    supabase = get_supabase()
    settings = get_settings()

    session_id = req.session_id or str(uuid.uuid4())
    if not req.session_id:
        supabase.table("chat_sessions").insert(
            {"id": session_id, "org_id": auth.org_id, "user_id": auth.user_id}
        ).execute()

    context = build_context(supabase, auth.org_id)
    prior_turns = get_conversation_history(supabase, session_id, auth.org_id) if req.session_id else []

    # Fresh data context goes on the latest user turn only — re-sending it on
    # every historical turn would waste tokens and risk the model treating
    # stale context as current.
    messages = prior_turns + [
        {
            "role": "user",
            "content": f"DATA CONTEXT (current as of this message):\n{json.dumps(context)}\n\nUser question: {req.message}",
        }
    ]

    client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=800,
        system=SYSTEM_PROMPT,
        messages=messages,
    )
    reply_text = "".join(block.text for block in response.content if block.type == "text")

    referenced_products = [r["product_id"] for r in context["top_risk_products"][:5]]

    supabase.table("chat_messages").insert(
        [
            {"session_id": session_id, "org_id": auth.org_id, "role": "user", "content": req.message},
            {
                "session_id": session_id,
                "org_id": auth.org_id,
                "role": "assistant",
                "content": reply_text,
                "referenced_products": referenced_products,
            },
        ]
    ).execute()

    return {"reply": reply_text, "session_id": session_id, "referenced_products": referenced_products}
