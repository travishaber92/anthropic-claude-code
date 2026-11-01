import { notFound } from "next/navigation";
import { getHomeBySlug } from "@/lib/db";
import { formatPrice, telHref, timeAgo } from "@/lib/options";
import BedBadge from "@/components/BedBadge";
import InquiryForm from "./InquiryForm";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const home = await getHomeBySlug((await params).slug);
  if (!home) return { title: "Home not found — BedBoard" };
  return {
    title: `${home.name} — ${home.city} sober living | BedBoard`,
    description: `${home.bedsAvailable} beds available today at ${home.name} in ${home.city}. ${home.gender}. ${formatPrice(home)}.`,
  };
}

export default async function HomePage({ params }) {
  const home = await getHomeBySlug((await params).slug);
  if (!home) notFound();

  return (
    <div className="space-y-5">
      <section className="card p-5">
        <div className="flex items-start gap-4">
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl font-bold text-slate-900">{home.name}</h1>
            <p className="mt-1 text-slate-600">{home.city}, CA</p>
          </div>
          <BedBadge beds={home.bedsAvailable} size="lg" />
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-slate-500">Serves</dt>
            <dd className="font-semibold text-slate-900">{home.gender}</dd>
          </div>
          <div className="rounded-xl bg-slate-50 p-3">
            <dt className="text-slate-500">Price</dt>
            <dd className="font-semibold text-slate-900">{formatPrice(home)}</dd>
          </div>
        </dl>

        {home.description && <p className="mt-4 text-slate-700 leading-relaxed">{home.description}</p>}

        <a href={telHref(home.phone)} className="btn-primary mt-5 w-full text-lg">
          <svg aria-hidden viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z" />
          </svg>
          Call {home.phone}
        </a>

        <p className="mt-3 text-center text-xs text-slate-500">
          Beds updated {timeAgo(home.updatedAt)}
        </p>
      </section>

      <section className="card p-5">
        <h2 className="text-lg font-semibold text-slate-900">Ask about a bed</h2>
        {home.inquiriesOn ? (
          <>
            <p className="mt-1 text-sm text-slate-600">
              Send your info and the house will call you back. Please don&apos;t include medical details.
            </p>
            <InquiryForm slug={home.slug} />
          </>
        ) : (
          <p className="mt-2 text-slate-600">
            This home isn&apos;t taking online inquiries right now. Please call{" "}
            <a className="font-semibold text-brand-700 underline" href={telHref(home.phone)}>{home.phone}</a>.
          </p>
        )}
      </section>
    </div>
  );
}
