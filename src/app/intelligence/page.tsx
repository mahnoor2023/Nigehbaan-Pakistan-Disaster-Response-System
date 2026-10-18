"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { cities, fetchWeather, type Weather } from "@/lib/liveWeather";
import { withDistrictQuery } from "@/lib/districtSelection";
import { useDistrictSelection } from "@/lib/useDistrictSelection";
import { useModel } from "@/lib/useModel";
import { TierBadge } from "@/components/ui";

const format = (value: number) => Number.isFinite(value) ? value.toFixed(1) : "—";

export default function Intelligence() {
  return <Suspense fallback={<main className="mx-auto max-w-7xl p-7" role="status">Loading overview…</main>}><IntelligenceContent /></Suspense>;
}

function IntelligenceContent() {
  const { districtId, district } = useDistrictSelection();
  const model = useModel(districtId);
  const [cityName, setCityName] = useState("Karachi");
  const [forecast, setForecast] = useState<{ cityName: string; data: Weather | null; error: string; updated: string }>({ cityName: "Karachi", data: null, error: "", updated: "" });
  const city = useMemo(() => cities.find((item) => item.name === cityName) ?? cities[0], [cityName]);

  useEffect(() => {
    const controller = new AbortController();
    fetchWeather(city, controller.signal)
      .then((data) => setForecast({ cityName: city.name, data, error: "", updated: new Date().toLocaleString("en-PK", { timeZone: "Asia/Karachi" }) }))
      .catch((error) => { if (!controller.signal.aborted) setForecast({ cityName: city.name, data: null, error: error instanceof Error ? error.message : "Forecast unavailable", updated: "" }); });
    return () => controller.abort();
  }, [city]);

  const current = forecast.cityName === cityName;
  const weather = current ? forecast.data : null;
  const weatherError = current ? forecast.error : "";
  const urgent = model.scored.filter((item) => item.score >= 25);
  const unmet = model.plan.peopleAtRisk - model.plan.peopleServed;
  const href = (path: string) => withDistrictQuery(path, "", districtId);

  return <main className="mx-auto w-full max-w-7xl space-y-7 px-4 py-7 sm:px-7 lg:py-10">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-200 pb-6">
      <div><p className="text-sm font-semibold text-sky-800">Pakistan-wide platform · Karachi demonstration</p><h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">Overview</h1><p className="mt-2 max-w-2xl text-base leading-7 text-slate-600">Karachi {district.name} at a glance. Weather is model output; response activity is a synthetic exercise.</p></div>
      <Link href={href("/command")} className="inline-flex min-h-11 items-center rounded-xl bg-sky-700 px-5 py-2.5 text-sm font-bold text-white hover:bg-sky-800">Open Command Center →</Link>
    </header>

    <section aria-label="District response indicators" className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
      {[["Households in exercise", model.loading ? "—" : model.hs.length, "Synthetic records"], ["High priority", model.loading ? "—" : urgent.length, "Scenario risk ranking"], ["Unmet people", model.loading ? "—" : unmet, "After suggested allocations"]].map(([label, value, note], index) => <div key={label} className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${index === 2 ? "col-span-2 sm:col-span-1" : ""}`}><p className="text-sm font-medium text-slate-600">{label}</p><p className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</p><p className="mt-1 text-sm text-slate-500">{note}</p></div>)}
    </section>

    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,1fr)]">
      <section aria-labelledby="weather-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm font-semibold text-sky-800">Public weather model</p><h2 id="weather-title" className="mt-1 text-2xl font-bold text-slate-900">Weather context</h2></div><span className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700">{weather ? "Model available" : weatherError ? "Source unavailable" : "Loading model"}</span></div>
        <label htmlFor="weather-city" className="mt-6 block text-sm font-semibold text-slate-700">City reference point</label><select id="weather-city" value={cityName} onChange={(event) => setCityName(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm sm:max-w-sm">{cities.map((item) => <option key={item.name} value={item.name}>{item.name} · {item.region}</option>)}</select>
        {weatherError ? <p role="alert" className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">Weather model unavailable: {weatherError}. No substitute values are shown.</p> : <div className="mt-6 grid gap-3 sm:grid-cols-3">{[["Temperature", weather ? `${format(weather.temperature)} °C` : "—"], ["Precipitation", weather ? `${format(weather.precipitation)} mm` : "—"], ["Wind speed", weather ? `${format(weather.wind)} km/h` : "—"]].map(([label, value]) => <div key={label} className="rounded-xl bg-slate-50 p-4"><p className="text-sm text-slate-600">{label}</p><p className="mt-2 text-2xl font-bold text-slate-900">{value}</p></div>)}</div>}
        {weather && <div className="mt-6"><h3 className="text-sm font-bold text-slate-800">Five-day precipitation forecast</h3><div className="mt-3 grid grid-cols-5 gap-2">{weather.dailyRain.map((rain, index) => <div key={weather.dailyDates[index]} className="rounded-lg border border-slate-200 p-2 text-center"><p className="text-xs text-slate-600">{new Date(`${weather.dailyDates[index]}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short" })}</p><p className="mt-1 text-sm font-bold text-slate-900">{format(rain ?? 0)} mm</p></div>)}</div></div>}
        <p className="mt-5 text-sm leading-6 text-slate-600"><a href="https://open-meteo.com/en/docs" target="_blank" rel="noreferrer" className="font-semibold text-sky-800 underline">Open-Meteo model and forecast</a> · City reference point, not a district observation. {weather ? `Model time ${weather.time}; retrieved ${forecast.updated}.` : ""}</p>
      </section>

      <section aria-labelledby="priority-title" className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7"><p className="text-sm font-semibold text-sky-800">Synthetic response exercise</p><h2 id="priority-title" className="mt-1 text-2xl font-bold text-slate-900">Priority households</h2><p className="mt-2 text-sm leading-6 text-slate-600">Rankings change with the flood scenario. They are not live alerts.</p>
        {model.loading ? <p role="status" className="mt-5 text-sm text-slate-600">Loading priorities…</p> : model.error ? <p role="alert" className="mt-5 text-sm text-red-700">Demo data unavailable: {model.error}</p> : <ol className="mt-5 divide-y divide-slate-100">{model.scored.slice(0, 4).map((item) => <li key={item.h.id} className="flex items-center justify-between gap-3 py-3"><span className="min-w-0"><strong className="block text-sm text-slate-900">{item.h.id}</strong><span className="block truncate text-sm text-slate-600">{item.reasons[0] ?? "Scenario priority"}</span></span><TierBadge tier={item.tier} score={item.score} /></li>)}</ol>}
        <Link href={href("/households")} className="mt-5 inline-flex min-h-10 items-center text-sm font-bold text-sky-800 hover:underline">View all households →</Link>
      </section>
    </div>

    <nav aria-label="Quick actions" className="grid gap-3 sm:grid-cols-3">{[["Explore coverage", "/coverage", "Map and district directory"], ["Review missions", "/missions", "Browser-local exercise records"], ["Check shelters", "/shelter", "Estimated and simulated capacity"]].map(([label, path, detail]) => <Link key={path} href={href(path)} className="rounded-xl border border-slate-200 bg-white p-4 hover:border-sky-300 hover:bg-sky-50"><strong className="block text-sm text-slate-900">{label} →</strong><span className="mt-1 block text-sm text-slate-600">{detail}</span></Link>)}</nav>
    <p className="rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm leading-6 text-amber-950"><strong>Demonstration only.</strong> Weather models cannot establish street-level flood safety. Households, shelter capacities, dispatch recommendations and mission statuses are simulated or browser-local—not verified emergency operations.</p>
  </main>;
}
