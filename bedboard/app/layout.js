import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "BedBoard — Sober living beds available today",
  description: "See which sober living homes have open beds today, and reach them directly.",
};

export const viewport = { width: "device-width", initialScale: 1, themeColor: "#0f766e" };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col">
        <header className="bg-white border-b border-slate-200">
          <div className="mx-auto max-w-2xl px-4 h-14 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold text-lg text-brand-800">
              <span aria-hidden className="grid place-items-center size-8 rounded-lg bg-brand-700 text-white text-sm">BB</span>
              BedBoard
            </Link>
            <Link href="/owner" className="text-sm font-medium text-slate-600 hover:text-brand-700">
              Owner login
            </Link>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-2xl px-4 py-6">{children}</main>

        <footer className="border-t border-slate-200 bg-white">
          <div className="mx-auto max-w-2xl px-4 py-6 text-xs leading-relaxed text-slate-500 space-y-2">
            <p>
              BedBoard lists bed availability for sober living homes. It is not a treatment provider
              and does not give medical advice. Please don&apos;t share medical or health details on this site.
            </p>
            <p>
              In an emergency, call <a className="underline" href="tel:911">911</a>. For free, confidential
              treatment referral 24/7, call the SAMHSA National Helpline at{" "}
              <a className="underline" href="tel:+18006624357">1-800-662-4357</a>.
            </p>
          </div>
        </footer>
      </body>
    </html>
  );
}
