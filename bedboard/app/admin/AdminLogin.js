"use client";

import { useActionState } from "react";
import { adminLogin } from "@/app/actions";

export default function AdminLogin() {
  const [state, action, pending] = useActionState(adminLogin, null);
  return (
    <div className="card p-6 max-w-sm mx-auto">
      <h1 className="text-xl font-bold text-slate-900">Admin login</h1>
      <form action={action} className="mt-5 space-y-4">
        <div>
          <label className="label" htmlFor="password">Admin password</label>
          <input id="password" name="password" type="password" required className="input" />
        </div>
        {state?.error && <p className="field-error">{state.error}</p>}
        <button disabled={pending} className="btn-primary w-full">{pending ? "Checking…" : "Log in"}</button>
      </form>
    </div>
  );
}
