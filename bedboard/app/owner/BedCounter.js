"use client";

import { useRef, useState } from "react";
import { changeBeds } from "@/app/actions";

// One tap = one bed. The number changes right away and saves in the background.
export default function BedCounter({ initial, total }) {
  const [beds, setBeds] = useState(initial);
  const [error, setError] = useState("");
  const inFlight = useRef(0);

  const max = total > 0 ? total : Infinity;

  async function tap(delta) {
    setError("");
    setBeds((b) => Math.min(max, Math.max(0, b + delta)));
    inFlight.current += 1;
    try {
      const saved = await changeBeds(delta);
      inFlight.current -= 1;
      if (inFlight.current === 0) setBeds(saved);
    } catch {
      inFlight.current -= 1;
      setError("Couldn't save. Check your connection and try again.");
    }
  }

  return (
    <div className="my-5">
      <div className="flex items-center justify-center gap-5">
        <button
          type="button"
          onClick={() => tap(-1)}
          disabled={beds <= 0}
          aria-label="One less open bed"
          className="btn size-20 rounded-full bg-slate-100 text-4xl font-bold text-slate-700 ring-1 ring-slate-300 hover:bg-slate-200"
        >
          −
        </button>
        <div className="w-24 text-center" aria-live="polite">
          <div className="text-6xl font-bold text-slate-900 tabular-nums">{beds}</div>
          {total > 0 && <div className="text-sm text-slate-500">of {total} beds</div>}
        </div>
        <button
          type="button"
          onClick={() => tap(1)}
          disabled={beds >= max}
          aria-label="One more open bed"
          className="btn size-20 rounded-full bg-brand-700 text-4xl font-bold text-white hover:bg-brand-800"
        >
          +
        </button>
      </div>
      {error && <p className="field-error text-center">{error}</p>}
    </div>
  );
}
