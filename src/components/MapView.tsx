"use client";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useRef, useState } from "react";
import type { Plan } from "@/lib/dispatch";
import { hasValidGeographicCoordinates } from "@/lib/geo";
import { advanceTileAvailability, initialTileAvailability, type TileAvailability } from "@/lib/mapTiles";
import { TIER_COLOR, type Scored } from "@/lib/scoring";
import type { Area, Resource, Shelter } from "@/lib/types";
import { RES_COLOR, RES_ICON } from "./ui";

export type MapProps = {
  area: Area; scored: Scored[]; shelters: Shelter[]; resources: Resource[]; plan: Plan;
  showPlan: boolean; selectedId: string | null; onSelect: (id: string) => void;
};

const GLYPH: Record<string, string> = { school: "S", hospital: "H", clinic: "C", community_centre: "C", place_of_worship: "M" };

function tooltip(value: string): HTMLElement {
  const span = document.createElement("span");
  span.textContent = value;
  return span;
}

function shelterIcon(s: Shelter) {
  return L.divIcon({
    className: "",
    html: `<div style="width:24px;height:24px;border-radius:6px;background:#1d4ed8;color:#fff;font:700 12px/24px system-ui;text-align:center;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.45)">${GLYPH[s.kind ?? ""] ?? "S"}</div>`,
    iconSize: [24, 24], iconAnchor: [12, 12],
  });
}
function resourceIcon(r: Resource) {
  return L.divIcon({
    className: "",
    html: `<div style="width:26px;height:26px;border-radius:50%;background:${RES_COLOR[r.type]};color:#fff;font:700 13px/22px system-ui;text-align:center;border:3px solid #fff;box-shadow:0 1px 5px rgba(0,0,0,.5)">${RES_ICON[r.type]}</div>`,
    iconSize: [26, 26], iconAnchor: [13, 13],
  });
}

/** Leaflet owns this DOM node for its entire lifetime; React never renders into it. */
export default function MapView({ area, scored, shelters, resources, plan, showPlan, selectedId, onSelect }: MapProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [mapReady, setMapReady] = useState(false);
  const [tiles, setTiles] = useState<TileAvailability>(initialTileAvailability);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !area.center || !hasValidGeographicCoordinates({ lat: area.center[0], lon: area.center[1] })) return;
    const map = L.map(container, { center: area.center, zoom: area.zoom, scrollWheelZoom: true, zoomAnimation: false });
    mapRef.current = map;
    const tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors", maxZoom: 19,
    });
    let timeout: number | undefined;
    const onLoading = () => {
      setTiles(initialTileAvailability);
      window.clearTimeout(timeout);
      timeout = window.setTimeout(() => setTiles((current) => advanceTileAvailability(current, "timeout")), 10000);
    };
    const onLoad = () => setTiles((current) => advanceTileAvailability(current, "load"));
    const onError = () => setTiles((current) => advanceTileAvailability(current, "error"));
    tileLayer.on("loading", onLoading);
    tileLayer.on("tileload", onLoad);
    tileLayer.on("tileerror", onError);
    tileLayer.addTo(map);
    const resize = new ResizeObserver(() => { if (mapRef.current === map) map.invalidateSize({ pan: false }); });
    resize.observe(container);
    const frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    setMapReady(true);
    return () => {
      window.clearTimeout(timeout);
      cancelAnimationFrame(frame);
      resize.disconnect();
      tileLayer.off("loading", onLoading);
      tileLayer.off("tileload", onLoad);
      tileLayer.off("tileerror", onError);
      mapRef.current = null;
      map.stop();
      map.remove();
    };
  }, [area.id, area.center, area.zoom]);

  useEffect(() => {
    const map = mapRef.current;
    if (!mapReady || !map) return;
    const layers = L.layerGroup().addTo(map);
    const servedIds = new Set(plan.assignments.map((assignment) => assignment.s.h.id));
    const selected = scored.find((item) => item.h.id === selectedId) ?? null;
    const selectedAssignment = plan.assignments.find((item) => item.s.h.id === selectedId) ?? null;

    if (showPlan) for (const route of plan.routes) {
      if (!hasValidGeographicCoordinates(route.resource)) continue;
      const stops = route.stops.filter((stop) => hasValidGeographicCoordinates(stop.s.h));
      if (!stops.length) continue;
      L.polyline([[route.resource.lat, route.resource.lon], ...stops.map((stop) => [stop.s.h.lat!, stop.s.h.lon!] as L.LatLngTuple)],
        { color: RES_COLOR[route.resource.type], weight: 3, opacity: 0.8, dashArray: "6 6" }).addTo(layers);
    }
    if (selectedAssignment?.shelter && hasValidGeographicCoordinates(selectedAssignment.s.h) && hasValidGeographicCoordinates(selectedAssignment.shelter)) {
      L.polyline([[selectedAssignment.s.h.lat, selectedAssignment.s.h.lon], [selectedAssignment.shelter.lat, selectedAssignment.shelter.lon]],
        { color: "#1d4ed8", weight: 4, opacity: 0.9 }).addTo(layers);
    }
    for (const item of scored) {
      if (!hasValidGeographicCoordinates(item.h)) continue;
      const hidden = item.h.source !== "simulated_listed";
      const served = showPlan && servedIds.has(item.h.id);
      L.circleMarker([item.h.lat, item.h.lon], {
        radius: 5 + Math.min(item.score, 60) / 8,
        color: item.h.source === "field_report" ? "#7c3aed" : hidden ? "#111827" : "#ffffff",
        weight: hidden ? 2.5 : 1, fillColor: TIER_COLOR[item.tier],
        fillOpacity: showPlan && !served && item.score >= 15 ? 0.45 : 0.9,
        dashArray: showPlan && item.score >= 15 && !served ? "2 3" : undefined,
      }).bindTooltip(tooltip(`${item.h.id} · ${item.tier} ${item.score}`), { direction: "top", offset: [0, -6] })
        .on("click", () => onSelect(item.h.id)).addTo(layers);
    }
    if (selected && hasValidGeographicCoordinates(selected.h)) {
      L.circleMarker([selected.h.lat, selected.h.lon], { radius: 16, color: "#0ea5e9", weight: 3, fill: false, interactive: false }).addTo(layers);
    }
    for (const shelter of shelters) {
      if (hasValidGeographicCoordinates(shelter)) L.marker([shelter.lat, shelter.lon], { icon: shelterIcon(shelter) })
        .bindTooltip(tooltip(`${shelter.name} · capacity estimate ~${shelter.capacity}`), { direction: "top", offset: [0, -10] }).addTo(layers);
    }
    for (const resource of resources) {
      if (hasValidGeographicCoordinates(resource)) L.marker([resource.lat, resource.lon], { icon: resourceIcon(resource) })
        .bindTooltip(tooltip(`${resource.label} · simulated seats ${resource.capacity}`), { direction: "top", offset: [0, -10] }).addTo(layers);
    }
    return () => { if (mapRef.current === map) layers.remove(); };
  }, [mapReady, scored, shelters, resources, plan, showPlan, selectedId, onSelect]);

  useEffect(() => {
    const selected = scored.find((item) => item.h.id === selectedId);
    const map = mapRef.current;
    if (mapReady && map && selected && hasValidGeographicCoordinates(selected.h)) {
      map.flyTo([selected.h.lat, selected.h.lon], Math.max(map.getZoom(), 16), { duration: 0.6 });
    }
  }, [mapReady, scored, selectedId]);

  return <div className="relative h-full min-h-[360px] w-full" aria-label="Malir sourced-point map with synthetic response markers">
    <div ref={containerRef} className="h-full min-h-[360px] w-full" />
    {tiles.status === "unavailable" && <div role="status" className="absolute left-3 top-3 z-[500] max-w-sm rounded-lg border border-amber-300 bg-amber-50/95 p-3 text-sm text-amber-950 shadow-lg">
      Basemap tiles are unavailable. Sourced Malir points and simulated routes remain visible; use the priority list for a non-map view. Tile access requires an internet connection.
    </div>}
  </div>;
}
