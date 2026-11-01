"use client";

import { useState, useTransition } from "react";
import { setInquiriesOn } from "@/app/actions";

export default function InquiryToggle({ initial }) {
  const [on, setOn] = useState(initial);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !on;
    setOn(next);
    startTransition(async () => {
      try {
        setOn(await setInquiriesOn(next));
      } catch {
        setOn(!next);
      }
    });
  }

  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <h2 className="font-semibold text-slate-900">Online inquiries</h2>
        <p className="text-sm text-slate-600">
          {on ? "On — people can send you inquiries." : "Off — your page only shows your phone number."}
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="Turn online inquiries on or off"
        onClick={toggle}
        disabled={pending}
        className={`relative h-9 w-16 shrink-0 rounded-full transition ${on ? "bg-brand-700" : "bg-slate-300"}`}
      >
        <span className={`absolute top-1 left-1 size-7 rounded-full bg-white shadow transition-transform ${on ? "translate-x-7" : ""}`} />
      </button>
    </div>
  );
}
