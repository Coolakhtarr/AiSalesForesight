from fastapi import APIRouter, Depends, HTTPException

from app.core.auth import AuthContext, get_current_org
from app.core.config import get_supabase

router = APIRouter()


@router.post("/generate")
def generate_purchase_orders(auth: AuthContext = Depends(get_current_org)):
    """
    Turns every 'reorder_now' product into a draft purchase order, grouped
    by supplier. Quantity ordered = reorder_point + safety_stock rounded up
    to a sensible order size (i.e. enough to comfortably clear the reorder
    point, not just barely meet it). Products without a supplier assigned
    are grouped into a single "Unassigned supplier" draft so nothing gets
    silently dropped.
    """
    supabase = get_supabase()

    risk_rows = (
        supabase.table("inventory_insights")
        .select("product_id,reorder_point,safety_stock,avg_daily_demand")
        .eq("org_id", auth.org_id)
        .eq("status", "reorder_now")
        .execute()
    )
    if not risk_rows.data:
        return {"message": "No products currently need reordering", "purchase_orders": []}

    product_ids = [r["product_id"] for r in risk_rows.data]
    products = (
        supabase.table("products")
        .select("id,name,unit_cost,supplier_id")
        .eq("org_id", auth.org_id)
        .in_("id", product_ids)
        .execute()
    )
    product_map = {p["id"]: p for p in products.data}

    # Group by supplier_id (None becomes its own "Unassigned" group)
    groups: dict = {}
    for row in risk_rows.data:
        product = product_map.get(row["product_id"])
        if not product:
            continue
        supplier_id = product.get("supplier_id")
        groups.setdefault(supplier_id, []).append((row, product))

    created_orders = []
    for supplier_id, items in groups.items():
        po = (
            supabase.table("purchase_orders")
            .insert({"org_id": auth.org_id, "supplier_id": supplier_id, "status": "draft"})
            .execute()
        )
        po_id = po.data[0]["id"]

        line_items = []
        total_cost = 0.0
        for row, product in items:
            order_qty = round((row["reorder_point"] or 0) + (row["safety_stock"] or 0))
            order_qty = max(order_qty, 1)
            unit_cost = product.get("unit_cost") or 0
            total_cost += order_qty * unit_cost
            line_items.append(
                {
                    "purchase_order_id": po_id,
                    "product_id": product["id"],
                    "quantity": order_qty,
                    "estimated_unit_cost": unit_cost,
                    "reason": f"Reorder point reached — ~{row['avg_daily_demand']:.1f} units/day average demand",
                }
            )

        supabase.table("purchase_order_items").insert(line_items).execute()
        supabase.table("purchase_orders").update({"total_estimated_cost": total_cost}).eq("id", po_id).execute()
        created_orders.append({"purchase_order_id": po_id, "supplier_id": supplier_id, "line_items": len(line_items), "total_estimated_cost": total_cost})

    return {"purchase_orders": created_orders}


@router.get("/{purchase_order_id}/pdf")
def get_purchase_order_pdf(purchase_order_id: str, auth: AuthContext = Depends(get_current_org)):
    """Generates a simple, clean PDF of the purchase order for download or emailing."""
    from fastapi.responses import Response
    from fpdf import FPDF

    supabase = get_supabase()
    po = (
        supabase.table("purchase_orders")
        .select("*,suppliers(name,email)")
        .eq("id", purchase_order_id)
        .eq("org_id", auth.org_id)
        .single()
        .execute()
    )
    if not po.data:
        raise HTTPException(404, "Purchase order not found")
    items = (
        supabase.table("purchase_order_items")
        .select("quantity,estimated_unit_cost,reason,products(name)")
        .eq("purchase_order_id", purchase_order_id)
        .execute()
    )
    org = supabase.table("organizations").select("name").eq("id", auth.org_id).single().execute()

    pdf = FPDF()
    pdf.add_page()
    pdf.set_font("Helvetica", "B", 16)
    pdf.cell(0, 10, "Purchase Order", ln=True)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"From: {org.data.get('name', '')}", ln=True)
    pdf.cell(0, 6, f"Supplier: {po.data.get('suppliers', {}).get('name', 'Unassigned') if po.data.get('suppliers') else 'Unassigned'}", ln=True)
    pdf.cell(0, 6, f"Order ID: {purchase_order_id}", ln=True)
    pdf.ln(6)

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(90, 8, "Product", border=1)
    pdf.cell(30, 8, "Qty", border=1)
    pdf.cell(35, 8, "Unit cost", border=1)
    pdf.cell(35, 8, "Line total", border=1, ln=True)

    pdf.set_font("Helvetica", "", 10)
    total = 0.0
    for item in items.data:
        line_total = (item.get("estimated_unit_cost") or 0) * item["quantity"]
        total += line_total
        pdf.cell(90, 8, str(item.get("products", {}).get("name", "")), border=1)
        pdf.cell(30, 8, str(item["quantity"]), border=1)
        pdf.cell(35, 8, f"{item.get('estimated_unit_cost') or 0:.2f}", border=1)
        pdf.cell(35, 8, f"{line_total:.2f}", border=1, ln=True)

    pdf.ln(4)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, f"Estimated total: {total:.2f}", ln=True)

    pdf_bytes = bytes(pdf.output())
    return Response(
        content=pdf_bytes,
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename=purchase_order_{purchase_order_id[:8]}.pdf"},
    )


@router.post("/{purchase_order_id}/send")
def send_purchase_order(purchase_order_id: str, auth: AuthContext = Depends(get_current_org)):
    """Emails the purchase order to the assigned supplier and marks it sent."""
    from app.routers.notifications import send_email

    supabase = get_supabase()
    po = (
        supabase.table("purchase_orders")
        .select("*,suppliers(name,email)")
        .eq("id", purchase_order_id)
        .eq("org_id", auth.org_id)
        .single()
        .execute()
    )
    if not po.data:
        raise HTTPException(404, "Purchase order not found")

    supplier = po.data.get("suppliers")
    if not supplier or not supplier.get("email"):
        raise HTTPException(400, "This supplier has no email on file — add one in Settings → Suppliers")

    items = (
        supabase.table("purchase_order_items")
        .select("quantity,estimated_unit_cost,products(name)")
        .eq("purchase_order_id", purchase_order_id)
        .execute()
    )
    rows_html = "".join(
        f"<tr><td>{i['products']['name']}</td><td>{i['quantity']}</td><td>{i.get('estimated_unit_cost') or 0}</td></tr>"
        for i in items.data
    )
    html = f"""
    <h2>Purchase Order</h2>
    <table border="1" cellpadding="6" cellspacing="0">
      <tr><th>Product</th><th>Quantity</th><th>Est. unit cost</th></tr>
      {rows_html}
    </table>
    <p>Estimated total: {po.data.get('total_estimated_cost', 0):.2f}</p>
    """

    sent = send_email(supplier["email"], "New Purchase Order", html)
    if sent:
        supabase.table("purchase_orders").update({"status": "sent", "sent_at": "now()"}).eq(
            "id", purchase_order_id
        ).execute()

    return {"sent": sent}


@router.get("/{purchase_order_id}")
def get_purchase_order(purchase_order_id: str, auth: AuthContext = Depends(get_current_org)):
    supabase = get_supabase()
    po = (
        supabase.table("purchase_orders")
        .select("*,suppliers(name,email,whatsapp_number)")
        .eq("id", purchase_order_id)
        .eq("org_id", auth.org_id)
        .single()
        .execute()
    )
    if not po.data:
        raise HTTPException(404, "Purchase order not found")

    items = (
        supabase.table("purchase_order_items")
        .select("*,products(name)")
        .eq("purchase_order_id", purchase_order_id)
        .execute()
    )
    return {"order": po.data, "items": items.data}
