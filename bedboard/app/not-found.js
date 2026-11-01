import Link from "next/link";

export default function NotFound() {
  return (
    <div className="card p-6 text-center">
      <h1 className="text-xl font-bold">Page not found</h1>
      <Link href="/" className="btn-primary mt-4">See all homes</Link>
    </div>
  );
}
