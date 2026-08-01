"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabaseClient";
import { track } from "@/lib/posthog";

export default function UploadStep({ orgId, kind }: { orgId: string; kind: "sales" | "inventory" }) {
  const [status, setStatus] = useState<"idle" | "uploading" | "processing" | "ready" | "failed">("idle");
  const supabase = createClient();

  async function handleFile(file: File) {
    setStatus("uploading");
    track("upload_data_started", { kind });

    const path = `${orgId}/${crypto.randomUUID()}-${file.name}`;
    const { error: uploadError } = await supabase.storage.from("raw-uploads").upload(path, file);
    if (uploadError) {
      setStatus("failed");
      return;
    }

    const { data: uploadRow, error: insertError } = await supabase
      .from("uploads")
      .insert({ org_id: orgId, storage_path: path, kind, status: "pending" })
      .select()
      .single();
    if (insertError || !uploadRow) {
      setStatus("failed");
      return;
    }

    setStatus("processing");
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const res = await fetch(
      `${process.env.NEXT_PUBLIC_ML_SERVICE_URL}/ingest/start?upload_id=${uploadRow.id}`,
      { method: "POST", headers: { Authorization: `Bearer ${session?.access_token}` } }
    );

    if (res.ok) {
      setStatus("ready");
      track("upload_completed", { kind });
    } else {
      setStatus("failed");
    }
  }

  return (
    <div className="border-2 border-dashed border-line rounded-xl p-8 text-center">
      <input
        type="file"
        accept=".csv,.xlsx"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        className="text-foreground"
      />
      <div className="mt-3 text-sm text-muted">
        {status === "idle" && "Upload your sales data (CSV or Excel)"}
        {status === "uploading" && "Uploading…"}
        {status === "processing" && "Cleaning data and preparing dataset…"}
        {status === "ready" && "✅ Dataset ready — check your dashboard."}
        {status === "failed" && "❌ Something went wrong. Please try again."}
      </div>
    </div>
  );
}
