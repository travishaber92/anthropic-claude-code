import Link from "next/link";
import { redirect } from "next/navigation";
import { getOwnerHomeId } from "@/lib/auth";
import { getHomeById, recentInquiries } from "@/lib/db";
import { telHref, timeAgo } from "@/lib/options";
import { logout } from "@/app/actions";
import BedCounter from "./BedCounter";
import PriceForm from "./PriceForm";
import InquiryToggle from "./InquiryToggle";

export const dynamic = "force-dynamic";

export default async function OwnerDashboard() {
  const id = await getOwnerHomeId();
  const home = id ? await getHomeById(id) : null;
  if (!home) redirect("/owner/login");
  const inquiries = await recentInquiries(home.id, 10);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-slate-500">Logged in as owner of</p>
          <h1 className="text-xl font-bold text-slate-900 truncate">{home.name}</h1>
        </div>
        <form action={logout}><button className="text-sm text-slate-600 underline">Log out</button></form>
      </div>

      <section className="card p-5">
        <h2 className="text-center font-semibold text-slate-900">Beds open today</h2>
        <BedCounter initial={home.bedsAvailable} total={home.totalBeds} />
        <p className="text-center text-xs text-slate-500">Last updated {timeAgo(home.updatedAt)}. Changes save instantly.</p>
      </section>

      <section className="card p-5">
        <InquiryToggle initial={home.inquiriesOn} />
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-slate-900">Price</h2>
        <PriceForm low={home.priceLow} high={home.priceHigh} period={home.pricePeriod} />
      </section>

      <section className="card p-5">
        <h2 className="font-semibold text-slate-900">Recent inquiries</h2>
        <p className="text-sm text-slate-500">These are also emailed to {home.ownerEmail}.</p>
        <ul className="mt-3 divide-y divide-slate-100">
          {inquiries.map((q) => (
            <li key={q.id} className="py-3 text-sm">
              <div className="flex justify-between gap-3">
                <span className="font-semibold text-slate-900">{q.name}</span>
                <span className="text-slate-500 shrink-0">{timeAgo(q.created_at)}</span>
              </div>
              <a href={telHref(q.phone)} className="text-brand-700 font-medium underline">{q.phone}</a>
              <p className="text-slate-600">
                For: {q.for_whom} · {q.payment}
                {q.move_in_date ? ` · Move-in ${q.move_in_date}` : ""}
              </p>
              {q.notes && <p className="mt-1 text-slate-600 italic">“{q.notes}”</p>}
            </li>
          ))}
          {inquiries.length === 0 && <li className="py-3 text-sm text-slate-500">No inquiries yet.</li>}
        </ul>
      </section>

      <Link href={`/homes/${home.slug}`} className="btn-ghost w-full">View my public page</Link>
    </div>
  );
}
