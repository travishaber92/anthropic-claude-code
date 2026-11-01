import Link from "next/link";
import { isAdmin } from "@/lib/auth";
import { listHomes } from "@/lib/db";
import { formatPrice, timeAgo } from "@/lib/options";
import { logout } from "@/app/actions";
import AdminLogin from "./AdminLogin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — BedBoard", robots: { index: false } };

export default async function AdminPage() {
  if (!(await isAdmin())) return <AdminLogin />;

  const homes = await listHomes();
  const totalOpen = homes.reduce((s, h) => s + h.bedsAvailable, 0);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-slate-900">Admin</h1>
        <form action={logout}><button className="text-sm text-slate-600 underline">Log out</button></form>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="card p-4 text-center">
          <div className="text-4xl font-bold text-brand-800">{totalOpen}</div>
          <div className="text-sm text-slate-600">total open beds</div>
        </div>
        <div className="card p-4 text-center">
          <div className="text-4xl font-bold text-slate-900">{homes.length}</div>
          <div className="text-sm text-slate-600">homes</div>
        </div>
      </div>

      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-500">
            <tr>
              <th className="p-3 font-medium">Home</th>
              <th className="p-3 font-medium text-right">Open</th>
              <th className="p-3 font-medium">Price</th>
              <th className="p-3 font-medium">Inquiries</th>
              <th className="p-3 font-medium">Updated</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {homes.map((h) => (
              <tr key={h.id}>
                <td className="p-3">
                  <Link href={`/homes/${h.slug}`} className="font-semibold text-brand-700 underline">{h.name}</Link>
                  <div className="text-slate-500">{h.city} · {h.gender} · {h.ownerEmail}</div>
                </td>
                <td className="p-3 text-right font-bold tabular-nums">{h.bedsAvailable}<span className="font-normal text-slate-400">/{h.totalBeds}</span></td>
                <td className="p-3 whitespace-nowrap">{formatPrice(h)}</td>
                <td className="p-3">{h.inquiriesOn ? "On" : "Off"}</td>
                <td className="p-3 whitespace-nowrap text-slate-500">{timeAgo(h.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
