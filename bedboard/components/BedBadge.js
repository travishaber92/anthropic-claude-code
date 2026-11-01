// Big, easy-to-read "beds available" badge.
export default function BedBadge({ beds, size = "md" }) {
  const open = beds > 0;
  const big = size === "lg";
  return (
    <div
      className={`rounded-2xl text-center ${open ? "bg-brand-50 text-brand-800 ring-1 ring-brand-100" : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"} ${big ? "px-6 py-4" : "px-3 py-2 min-w-20"}`}
    >
      <div className={`font-bold leading-none ${big ? "text-5xl" : "text-2xl"}`}>{beds}</div>
      <div className={`mt-1 font-medium ${big ? "text-sm" : "text-xs"}`}>
        {beds === 1 ? "bed open" : "beds open"}
      </div>
    </div>
  );
}
