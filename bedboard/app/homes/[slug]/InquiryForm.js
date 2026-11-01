"use client";

import { useActionState } from "react";
import { submitInquiry } from "@/app/actions";
import { FOR_WHOM, PAYMENT } from "@/lib/options";

function Choice({ name, options, defaultValue }) {
  return (
    <div className="grid gap-2">
      {options.map((opt) => (
        <label
          key={opt}
          className="flex items-center gap-3 rounded-xl border border-slate-300 px-4 py-3 has-[:checked]:border-brand-600 has-[:checked]:bg-brand-50 cursor-pointer"
        >
          <input type="radio" name={name} value={opt} defaultChecked={defaultValue === opt} required className="size-4 accent-brand-700" />
          <span>{opt}</span>
        </label>
      ))}
    </div>
  );
}

export default function InquiryForm({ slug }) {
  const [state, action, pending] = useActionState(submitInquiry, null);

  if (state?.ok) {
    return (
      <div className="mt-4 rounded-xl bg-brand-50 p-5 text-brand-900 ring-1 ring-brand-100" role="status">
        <p className="font-semibold">Thank you — your inquiry was sent.</p>
        <p className="mt-1 text-sm">The house will call you back soon. If it&apos;s urgent, please call them directly.</p>
      </div>
    );
  }

  const v = state?.values ?? {};
  const err = state?.errors ?? {};
  const today = new Date().toISOString().slice(0, 10);

  return (
    <form action={action} className="mt-4 space-y-5" noValidate={false}>
      <input type="hidden" name="slug" value={slug} />
      {/* Spam trap: hidden from people */}
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />

      <div>
        <label className="label" htmlFor="name">Your name</label>
        <input id="name" name="name" className="input" autoComplete="name" required defaultValue={v.name} />
        {err.name && <p className="field-error">{err.name}</p>}
      </div>

      <div>
        <label className="label" htmlFor="phone">Phone number</label>
        <input id="phone" name="phone" type="tel" inputMode="tel" className="input" autoComplete="tel" placeholder="(714) 555-0123" required defaultValue={v.phone} />
        {err.phone && <p className="field-error">{err.phone}</p>}
      </div>

      <fieldset>
        <legend className="label">Who is the bed for?</legend>
        <Choice name="forWhom" options={FOR_WHOM} defaultValue={v.forWhom} />
        {err.forWhom && <p className="field-error">{err.forWhom}</p>}
      </fieldset>

      <fieldset>
        <legend className="label">How will you pay?</legend>
        <Choice name="payment" options={PAYMENT} defaultValue={v.payment} />
        {err.payment && <p className="field-error">{err.payment}</p>}
      </fieldset>

      <div>
        <label className="label" htmlFor="moveInDate">Hoped-for move-in date <span className="font-normal text-slate-500">(optional)</span></label>
        <input id="moveInDate" name="moveInDate" type="date" min={today} className="input" defaultValue={v.moveInDate} />
        {err.moveInDate && <p className="field-error">{err.moveInDate}</p>}
      </div>

      <div>
        <label className="label" htmlFor="notes">Notes <span className="font-normal text-slate-500">(optional)</span></label>
        <textarea id="notes" name="notes" rows={3} maxLength={1000} className="input" placeholder="Best time to call, questions about the house…" defaultValue={v.notes} />
        <p className="mt-1 text-xs text-slate-500">Please don&apos;t include medical, diagnosis, or insurance ID details.</p>
      </div>

      {state?.error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-800 ring-1 ring-red-200">{state.error}</p>}

      <button type="submit" disabled={pending} className="btn-primary w-full text-lg">
        {pending ? "Sending…" : "Send inquiry"}
      </button>
    </form>
  );
}
