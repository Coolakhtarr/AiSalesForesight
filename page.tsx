import AppShell from "@/components/layout/AppShell";
import GeneratePOButton from "@/components/purchase-orders/GeneratePOButton";
import PurchaseOrderCard from "@/components/purchase-orders/PurchaseOrderCard";
import { createServerClient } from "@/lib/supabaseServer";

export default async function PurchaseOrdersPage() {
  const supabase = createServerClient();

  const { data: orders } = await supabase
    .from("purchase_orders")
    .select("id,status,total_estimated_cost,suppliers(name)")
    .order("created_at", { ascending: false });

  const ordersWithItems = await Promise.all(
    (orders || []).map(async (order: any) => {
      const { data: items } = await supabase
        .from("purchase_order_items")
        .select("id,quantity,estimated_unit_cost,reason,products(name)")
        .eq("purchase_order_id", order.id);
      return { ...order, items: items || [] };
    })
  );

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="font-display text-xl font-semibold">Purchase orders</h1>
          <p className="text-sm text-muted mt-1">
            Draft orders generated from today's reorder list — review, then export or send.
          </p>
        </div>
        <GeneratePOButton />
      </div>

      {ordersWithItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line p-10 text-center text-sm text-muted">
          No draft purchase orders yet. Click "Generate draft POs" once you have products flagged as
          "Reorder now" on your Products page.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {ordersWithItems.map((order: any) => (
            <PurchaseOrderCard
              key={order.id}
              id={order.id}
              supplierName={order.suppliers?.name ?? "Unassigned supplier"}
              status={order.status}
              totalCost={order.total_estimated_cost}
              items={order.items}
            />
          ))}
        </div>
      )}
    </AppShell>
  );
}
