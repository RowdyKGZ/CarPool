"use client";

import dynamic from "next/dynamic";

export type LatLng = { lat: number; lng: number };
export type PinKind = "pickup" | "dropoff";

export type TripMapProps = {
  pickup: LatLng | null;
  dropoff: LatLng | null;
  interactive?: boolean;
  onPick?: (kind: PinKind, coords: LatLng, address: string | null) => void;
  className?: string;
};

// maplibre-gl touches `window` on import — must not run on the server.
const TripMapImpl = dynamic(() => import("./trip-map-impl"), {
  ssr: false,
  loading: () => (
    <div className="h-72 animate-pulse rounded-3xl border border-line bg-white" />
  ),
});

export function TripMap(props: TripMapProps) {
  return <TripMapImpl {...props} />;
}
