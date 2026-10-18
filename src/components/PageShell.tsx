export default function PageShell({ title, subtitle, children }: { title: string; subtitle?: string; children?: React.ReactNode }) {
  return (
    <main className="page-shell mx-auto w-full max-w-7xl flex-1 px-4 py-7 sm:px-7 lg:py-10">
      <div className="page-heading"><h1 className="text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
      {subtitle && <p className="mt-2 max-w-4xl text-base leading-7 text-slate-600">{subtitle}</p>}</div>
      <div className="mt-7">{children}</div>
    </main>
  );
}

export function Loading({ error }: { error?: string | null }) {
  if (error) return <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-5 text-sm text-red-800">Could not load demo data: {error}. Run <code>npm run data</code>.</div>;
  return <div role="status" className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600">Loading demonstration data…</div>;
}
