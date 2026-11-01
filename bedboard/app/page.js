import Link from "next/link";
import { listHomes } from "@/lib/db";
import { formatPrice } from "@/lib/options";
import BedBadge from "@/components/BedBadge";

export const dynamic = "force-dynamic";

export default async function HomesList() {
  const homes = await listHomes();
  const totalOpen = homes.reduce((sum, h) => sum + h.bedsAvailable, 0);

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-slate-900">Sober living beds available today</h1>
        <p className="mt-1 text-slate-600">
          {totalOpen} open {totalOpen === 1 ? "bed" : "beds"} across {homes.length}{" "}
          {homes.length === 1 ? "home" : "homes"}. Updated by each home&apos;s owner.
        </p>
      </section>

      <ul className="space-y-3">
        {homes.map((h) => (
          <li key={h.id}>
            <Link href={`/homes/${h.slug}`} className="card flex items-center gap-4 p-4 hover:ring-brand-600 transition">
              <div className="flex-1 min-w-0">
                <h2 className="font-semibold text-slate-900 truncate">{h.name}</h2>
                <p className="text-sm text-slate-600">{h.city} · {h.gender}</p>
                <p className="text-sm text-slate-500">{formatPrice(h)}</p>
              </div>
              <BedBadge beds={h.bedsAvailable} />
            </Link>
          </li>
        ))}
        {homes.length === 0 && (
          <li className="card p-6 text-center text-slate-600">
            No homes yet. Run <code>npm run seed</code> to add demo homes.
          </li>
        )}
      </ul>
    </div>
  );
}
