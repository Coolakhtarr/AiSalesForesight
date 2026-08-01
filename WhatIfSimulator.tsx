"use client";

import { useState } from "react";

type Props = {
  productName: string;
  currentPrice: number;
  currentQuantity: number;
  elasticity: number; // e.g. -0.8
};

export default function WhatIfSimulator({ productName, currentPrice, currentQuantity, elasticity }: Props) {
  const [priceChangePct, setPriceChangePct] = useState(0);

  const newPrice = currentPrice * (1 + priceChangePct / 100);
  // % change in quantity ≈ elasticity * % change in price (standard approximation)
  const qtyChangePct = elasticity * priceChangePct;
  const newQuantity = Math.max(currentQuantity * (1 + qtyChangePct / 100), 0);

  const currentRevenue = currentPrice * currentQuantity;
  const projectedRevenue = newPrice * newQuantity;
  const revenueDelta = projectedRevenue - currentRevenue;
  const revenueDeltaPct = currentRevenue ? (revenueDelta / currentRevenue) * 100 : 0;

  return (
    <div className="rounded-xl bg-panel border border-line p-5">
      <div className="flex items-center justify-between mb-1">
        <h3 className="font-display text-sm font-semibold">{productName}</h3>
        <span className="text-xs text-muted font-mono">elasticity {elasticity.toFixed(2)}</span>
      </div>
      <p className="text-xs text-muted mb-4">Drag to simulate a price change and see the projected effect on revenue.</p>

      <input
        type="range"
        min={-30}
        max={30}
        step={1}
        value={priceChangePct}
        onChange={(e) => setPriceChangePct(Number(e.target.value))}
        className="w-full accent-signal-teal mb-2"
      />
      <div className="flex justify-between text-xs text-muted mb-5 font-mono">
        <span>-30%</span>
        <span className={priceChangePct === 0 ? "text-foreground" : "text-signal-teal"}>
          {priceChangePct > 0 ? "+" : ""}
          {priceChangePct}% price
        </span>
        <span>+30%</span>
      </div>

      <div className="grid grid-cols-3 gap-3 text-sm">
        <div>
          <div className="text-xs text-muted mb-1">New price</div>
          <div className="font-mono">₹{newPrice.toFixed(0)}</div>
        </div>
        <div>
          <div className="text-xs text-muted mb-1">Projected units</div>
          <div className="font-mono">{newQuantity.toFixed(0)}</div>
        </div>
        <div>
          <div className="text-xs text-muted mb-1">Revenue impact</div>
          <div className={`font-mono ${revenueDelta >= 0 ? "text-signal-teal" : "text-signal-coral"}`}>
            {revenueDelta >= 0 ? "+" : ""}
            {revenueDeltaPct.toFixed(1)}%
          </div>
        </div>
      </div>

      <p className="text-[11px] text-muted mt-4 leading-relaxed">
        Estimate based on historical price sensitivity — treat as directional guidance, not a guarantee.
      </p>
    </div>
  );
}
