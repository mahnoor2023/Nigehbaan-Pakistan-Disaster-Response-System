"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { demoAreaForDistrict, districtHasMapCoordinates, withDistrictQuery } from "@/lib/districtSelection";
import { karachiDistricts } from "@/lib/geography";
import { useStore } from "@/lib/store";
import { useDistrictSelection } from "@/lib/useDistrictSelection";

const primaryLinks = [
  { href: "/intelligence", label: "Overview", icon: "◫" },
  { href: "/coverage", label: "Coverage map", icon: "◇" },
  { href: "/command", label: "Command center", icon: "▦" },
  { href: "/households", label: "Households", icon: "⌂" },
  { href: "/missions", label: "Rescue missions", icon: "↗" },
  { href: "/shelter", label: "Shelters", icon: "▤" },
];
const secondaryLinks = [
  { href: "/field", label: "Field app" },
  { href: "/analytics", label: "Analytics" },
  { href: "/about", label: "About" },
];

function routeHref(href: string, districtId: string) {
  return href === "/about" ? href : withDistrictQuery(href, "", districtId);
}

export default function Nav() {
  return <Suspense fallback={<header className="app-sidebar" aria-label="Loading navigation"><span className="app-brand">Nigehbaan</span></header>}><NavContent /></Suspense>;
}

function NavContent() {
  const pathname = usePathname();
  const { districtId, district, selectDistrict } = useDistrictSelection();
  const store = useStore();
  const areaId = demoAreaForDistrict(districtId);
  const pending = store.reports.filter((report) => !report.synced && report.area === areaId).length;
  const mapped = districtHasMapCoordinates(districtId);

  return <header className="app-sidebar">
    <a href="#main-content" className="skip-link">Skip to main content</a>
    <div className="app-sidebar-head">
      <Link href={routeHref("/intelligence", districtId)} className="app-brand" aria-label="Nigehbaan overview"><span className="app-brand-mark" aria-hidden="true">N</span><span><strong>Nigehbaan</strong><small>Disaster response demo</small></span></Link>
      <span className="app-prototype">PROTOTYPE · NOT AN EMERGENCY SERVICE</span>
    </div>

    <div className="app-district">
      <label htmlFor="app-district-select">Karachi district</label>
      <select id="app-district-select" aria-label="Karachi district" value={districtId} onChange={(event) => selectDistrict(event.target.value)}>
        {karachiDistricts.map((item) => <option key={item.id} value={item.id}>Karachi {item.name}</option>)}
      </select>
      <p>{mapped ? "Sourced points + synthetic exercise" : "Synthetic non-map exercise"}</p>
    </div>

    <nav className="app-primary-nav" aria-label="Primary navigation">
      {primaryLinks.map((item) => <Link key={item.href} href={routeHref(item.href, districtId)} aria-current={pathname === item.href ? "page" : undefined} className="app-nav-link"><span aria-hidden="true" className="app-nav-icon">{item.icon}</span>{item.label}</Link>)}
    </nav>
    <details className="app-more"><summary>More tools</summary><nav aria-label="Additional navigation">{secondaryLinks.map((item) => <Link key={item.href} href={routeHref(item.href, districtId)} aria-current={pathname === item.href ? "page" : undefined} className="app-nav-link">{item.label}</Link>)}</nav></details>
    <div className="app-sidebar-foot"><span>Karachi {district.name} · demonstration</span>{store.offline && <span role="status" className="app-offline">Offline{pending ? ` · ${pending} queued` : ""}</span>}</div>
  </header>;
}
