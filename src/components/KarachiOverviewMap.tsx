"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo, useRef, useState } from "react";
import { KARACHI_CITY_REFERENCE, karachiMapView, validMalirMapPoints, type KarachiMapLayers } from "@/lib/karachiMap";
import { advanceTileAvailability, initialTileAvailability, type TileAvailability } from "@/lib/mapTiles";
import type { Household, Shelter } from "@/lib/types";

type Props = { districtId: string; layers: KarachiMapLayers; households: Household[]; shelters: Shelter[] };

export default function KarachiOverviewMap({ districtId, layers, households, shelters }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const [ready, setReady] = useState(false);
  const [tiles, setTiles] = useState<TileAvailability>(initialTileAvailability);
  const malirBuildings = useMemo(() => validMalirMapPoints(households), [households]);
  const malirFacilities = useMemo(() => validMalirMapPoints(shelters), [shelters]);
  const view = useMemo(() => karachiMapView(districtId, malirBuildings), [districtId, malirBuildings]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    // Leaflet's CSS zoom-transition timeout may fire after React unmounts the map.
    const map = L.map(container, { center: [KARACHI_CITY_REFERENCE.lat, KARACHI_CITY_REFERENCE.lon], zoom: 10, scrollWheelZoom: false, zoomAnimation: false });
    mapRef.current = map;
    const tileLayer = L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '<a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors (ODbL)</a>',
      maxZoom: 19,
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
    const resize = new ResizeObserver(() => map.invalidateSize({ pan: false }));
    resize.observe(container);
    const frame = requestAnimationFrame(() => map.invalidateSize({ pan: false }));
    setReady(true);
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
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    if (view.mode === "city") map.flyTo(view.center, view.zoom, { duration: 0.7 });
    else map.flyToBounds(view.bounds, { padding: [25, 25], maxZoom: 13, duration: 0.7 });
  }, [ready, view]);

  useEffect(() => {
    const map = mapRef.current;
    if (!ready || !map) return;
    const group = L.layerGroup().addTo(map);
    if (layers.sourcedFeatures) {
      L.circleMarker([KARACHI_CITY_REFERENCE.lat, KARACHI_CITY_REFERENCE.lon], {
        radius: 7, color: "#0f766e", fillColor: "#14b8a6", fillOpacity: 0.9, weight: 2,
      }).bindTooltip("Karachi city reference point · Wikidata Q8660; not a boundary").addTo(group);
      if (view.mode === "malir") for (const point of malirBuildings) {
        L.circleMarker([point.lat!, point.lon!], { radius: 3, color: "#475569", fillColor: "#94a3b8", fillOpacity: 0.6, weight: 1 })
          .bindTooltip("OSM-derived building sample · not a verified household").addTo(group);
      }
    }
    if (view.mode === "malir") {
      if (layers.simulation) for (const point of malirBuildings) {
        L.circleMarker([point.lat!, point.lon!], { radius: 5, color: "#0369a1", fillColor: "#38bdf8", fillOpacity: 0.65, weight: 1 })
          .bindTooltip(`${point.id} · synthetic response scenario at an OSM-derived building point`).addTo(group);
      }
      if (layers.shelterCandidates) for (const facility of malirFacilities) {
        L.circleMarker([facility.lat!, facility.lon!], { radius: 7, color: "#4338ca", fillColor: "#818cf8", fillOpacity: 0.85, weight: 2 })
          .bindTooltip(`${facility.name} · sourced facility candidate; shelter availability and capacity not verified`).addTo(group);
      }
    }
    return () => { if (mapRef.current === map) group.remove(); };
  }, [ready, view.mode, layers.sourcedFeatures, layers.simulation, layers.shelterCandidates, malirBuildings, malirFacilities]);

  return <div className="relative h-full w-full" aria-label="Karachi city basemap; use the adjacent district selector as a text alternative">
    <div ref={containerRef} className="h-full w-full" />
    {tiles.status === "unavailable" && <div role="status" className="absolute left-3 top-3 z-[500] max-w-xs rounded-lg border border-amber-300 bg-amber-50/95 p-3 text-sm text-amber-950 shadow-lg">
      Map tiles could not load. Use the adjacent district selector and coverage directory; no boundary or scenario data is lost.
    </div>}
  </div>;
}
