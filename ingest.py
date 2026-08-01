import tempfile
import uuid

from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import AuthContext, get_current_org
from app.core.config import get_supabase
from app.services import data_prep

router = APIRouter()


@router.post("/start")
def start_ingest(upload_id: str, auth: AuthContext = Depends(get_current_org)):
    """
    Triggered after a file lands in Supabase Storage (called directly by the
    frontend for MVP, or by an Inngest function in production for retries /
    async processing).
    """
    supabase = get_supabase()

    upload = (
        supabase.table("uploads")
        .select("*")
        .eq("id", upload_id)
        .eq("org_id", auth.org_id)  # never trust org_id from the client
        .single()
        .execute()
    )
    if not upload.data:
        raise HTTPException(404, "Upload not found")

    supabase.table("uploads").update({"status": "processing"}).eq("id", upload_id).execute()

    try:
        # Download raw file from storage to a temp path
        storage_path = upload.data["storage_path"]
        file_bytes = supabase.storage.from_("raw-uploads").download(storage_path)
        suffix = ".csv" if storage_path.endswith(".csv") else ".xlsx"
        with tempfile.NamedTemporaryFile(suffix=suffix, delete=False) as tmp:
            tmp.write(file_bytes)
            tmp_path = tmp.name

        raw_df = data_prep.load_raw_file(tmp_path)
        clean_df = data_prep.clean_sales_dataframe(raw_df)
        products_df = data_prep.extract_products(clean_df)
        featured_df = data_prep.add_features(clean_df)

        # Upsert products, get back their generated ids
        product_records = [
            {"org_id": auth.org_id, "external_product_id": r.external_product_id, "name": r.name}
            for r in products_df.itertuples()
        ]
        if product_records:
            supabase.table("products").upsert(
                product_records, on_conflict="org_id,external_product_id"
            ).execute()

        existing_products = (
            supabase.table("products").select("id,external_product_id").eq("org_id", auth.org_id).execute()
        )
        id_map = {p["external_product_id"]: p["id"] for p in existing_products.data}

        sales_records = []
        for r in featured_df.itertuples():
            product_id = id_map.get(r.product_id)
            if not product_id:
                continue
            sales_records.append(
                {
                    "org_id": auth.org_id,
                    "product_id": product_id,
                    "date": r.date.strftime("%Y-%m-%d"),
                    "quantity": float(r.quantity_sold),
                    "price": float(r.price),
                    "location": r.location,
                    "discount_flag": bool(r.discount_flag),
                }
            )

        # Insert in batches to avoid oversized requests
        batch_size = 500
        for i in range(0, len(sales_records), batch_size):
            supabase.table("sales").insert(sales_records[i : i + batch_size]).execute()

        supabase.table("uploads").update(
            {"status": "ready", "processed_at": "now()"}
        ).eq("id", upload_id).execute()

        return {"status": "ready", "rows_ingested": len(sales_records), "products": len(product_records)}

    except Exception as e:
        supabase.table("uploads").update(
            {"status": "failed", "error_message": str(e)}
        ).eq("id", upload_id).execute()
        raise HTTPException(500, f"Ingest failed: {e}")
