"use client";

import { useActionState } from "react";
import { ownerLogin } from "@/app/actions";

export default function OwnerLogin() {
  const [state, action, pending] = useActionState(ownerLogin, null);
  return (
    <div className="card p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-bold text-slate-900">Owner login</h1>
      <p className="mt-1 text-sm text-slate-600">Update your open beds, price, and inquiries.</p>
      <form action={action} className="mt-5 space-y-4">
        <div>
          <label className="label" htmlFor="email">Email</label>
          <input id="email" name="email" type="email" autoComplete="email" required className="input" defaultValue={state?.email} />
        </div>
        <div>
          <label className="label" htmlFor="password">Password</label>
          <input id="password" name="password" type="password" autoComplete="current-password" required className="input" />
        </div>
        {state?.error && <p className="field-error">{state.error}</p>}
        <button disabled={pending} className="btn-primary w-full">{pending ? "Logging in…" : "Log in"}</button>
      </form>
    </div>
  );
}
