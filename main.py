from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import ingest, forecast, insights, chat, jobs, purchase_orders, notifications, internal

app = FastAPI(title="AiSalesForesight ML Service", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # restrict to your Vercel domain(s) in production
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ingest.router, prefix="/ingest", tags=["ingest"])
app.include_router(forecast.router, prefix="/forecast", tags=["forecast"])
app.include_router(insights.router, prefix="/insights", tags=["insights"])
app.include_router(chat.router, prefix="/chat", tags=["chat"])
app.include_router(jobs.router, prefix="/jobs", tags=["jobs"])
app.include_router(purchase_orders.router, prefix="/purchase-orders", tags=["purchase-orders"])
app.include_router(notifications.router, prefix="/notifications", tags=["notifications"])
app.include_router(internal.router, prefix="/internal", tags=["internal"])


@app.get("/health")
def health():
    return {"status": "ok"}
