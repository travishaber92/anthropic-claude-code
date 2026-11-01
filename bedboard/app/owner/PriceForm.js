"use client";

import { useActionState } from "react";
import { updatePrice } from "@/app/actions";

export default function PriceForm({ low, high, period }) {
  const [state, action, pending] = useActionState(updatePrice, null);
  return (
    <form action={action} className="mt-3 space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="label" htmlFor="priceLow">Lowest ($)</label>
          <input id="priceLow" name="priceLow" type="number" inputMode="numeric" min="0" step="1" defaultValue={low} className="input" required />
        </div>
        <div>
          <label className="label" htmlFor="priceHigh">Highest ($)</label>
          <input id="priceHigh" name="priceHigh" type="number" inputMode="numeric" min="0" step="1" defaultValue={high} className="input" required />
        </div>
      </div>
      <div>
        <label className="label" htmlFor="pricePeriod">Charged per</label>
        <select id="pricePeriod" name="pricePeriod" defaultValue={period} className="input">
          <option value="month">Month</option>
          <option value="week">Week</option>
        </select>
      </div>
      {state?.error && <p className="field-error">{state.error}</p>}
      {state?.ok && !pending && <p className="text-sm font-medium text-brand-700">Saved ✓</p>}
      <button disabled={pending} className="btn-primary w-full">{pending ? "Saving…" : "Save price"}</button>
    </form>
  );
}
