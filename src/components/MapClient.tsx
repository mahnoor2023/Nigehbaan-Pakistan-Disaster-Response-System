"use client";
import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import type { MapProps } from "./MapView";

// Leaflet touches `window`, so the map is loaded on the client only.
const MapView = dynamic(() => import("./MapView"), {
  ssr: false,
  loading: () => <div role="status" className="flex h-full items-center justify-center text-sm text-slate-500">Loading map...</div>,
});

export default function MapClient(props: MapProps) {
  return <DeferredMap key={props.area.id} {...props} />;
}

function DeferredMap(props: MapProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setReady(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  if (!ready) {
    return <div role="status" className="flex h-full items-center justify-center text-sm text-slate-500">Preparing map...</div>;
  }

  // A district change must create a fresh Leaflet container. Deferring one frame
  // also gives React time to finish disposing the previous Leaflet instance.
  return <MapView {...props} />;
}
