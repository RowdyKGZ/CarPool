"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Map, {
  Layer,
  Marker,
  Source,
  type MapLayerMouseEvent,
  type MarkerDragEvent,
} from "react-map-gl/maplibre";
import { ruContent } from "@/lib/content/ru";
import type { LatLng, PinKind, TripMapProps } from "./trip-map";

const MAP_STYLE = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    },
  },
  layers: [{ id: "osm", type: "raster" as const, source: "osm" }],
};

const BISHKEK_CENTER = { latitude: 42.8746, longitude: 74.5698 };

type RouteGeometry = {
  type: "Feature";
  properties: Record<string, never>;
  geometry: { type: "LineString"; coordinates: number[][] };
};

async function fetchRoute(
  a: LatLng,
  b: LatLng,
): Promise<RouteGeometry | null> {
  try {
    const url =
      `https://router.project-osrm.org/route/v1/driving/` +
      `${a.lng},${a.lat};${b.lng},${b.lat}` +
      `?overview=full&geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) return null;
    const data = (await res.json()) as {
      routes?: { geometry: { type: string; coordinates: number[][] } }[];
    };
    const coords = data.routes?.[0]?.geometry?.coordinates;
    if (!coords?.length) return null;
    return {
      type: "Feature",
      properties: {},
      geometry: { type: "LineString", coordinates: coords },
    };
  } catch {
    return null;
  }
}

async function reverseGeocode(coords: LatLng): Promise<string | null> {
  try {
    const url =
      `https://nominatim.openstreetmap.org/reverse` +
      `?lat=${coords.lat}&lon=${coords.lng}&format=json&accept-language=ru`;
    const res = await fetch(url, {
      headers: { "User-Agent": "CarPoolBishkek/1.0" },
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

export default function TripMapImpl({
  pickup,
  dropoff,
  interactive = false,
  onPick,
  className,
}: TripMapProps) {
  const c = ruContent.tripMap;
  const [mode, setMode] = useState<PinKind>("pickup");
  const [geocoding, setGeocoding] = useState(false);
  const [routeGeoJson, setRouteGeoJson] = useState<RouteGeometry | null>(null);

  useEffect(() => {
    if (!pickup || !dropoff) return;
    let cancelled = false;
    void fetchRoute(pickup, dropoff).then((geom) => {
      if (!cancelled) setRouteGeoJson(geom);
    });
    return () => {
      cancelled = true;
    };
  }, [pickup, dropoff]);

  const applyPin = useCallback(
    async (kind: PinKind, coords: LatLng) => {
      if (!onPick) return;
      onPick(kind, coords, null);
      setGeocoding(true);
      const address = await reverseGeocode(coords);
      setGeocoding(false);
      onPick(kind, coords, address);
    },
    [onPick],
  );

  const handleMapClick = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!interactive) return;
      const coords = { lat: e.lngLat.lat, lng: e.lngLat.lng };
      void applyPin(mode, coords);
      if (mode === "pickup") setMode("dropoff");
    },
    [interactive, applyPin, mode],
  );

  const handleDragEnd = useCallback(
    (kind: PinKind) => (e: MarkerDragEvent) => {
      void applyPin(kind, { lat: e.lngLat.lat, lng: e.lngLat.lng });
    },
    [applyPin],
  );

  const initialViewState = useMemo(() => {
    const anchor = pickup ?? dropoff;
    if (pickup && dropoff) {
      return {
        latitude: (pickup.lat + dropoff.lat) / 2,
        longitude: (pickup.lng + dropoff.lng) / 2,
        zoom: 12,
      };
    }
    return {
      latitude: anchor?.lat ?? BISHKEK_CENTER.latitude,
      longitude: anchor?.lng ?? BISHKEK_CENTER.longitude,
      zoom: anchor ? 14 : 12,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className={`space-y-3 ${className ?? ""}`}>
      {interactive ? (
        <>
          <div className="flex flex-wrap gap-2">
            <ModeButton
              active={mode === "pickup"}
              onClick={() => setMode("pickup")}
              label={c.pickupMode}
            />
            <ModeButton
              active={mode === "dropoff"}
              onClick={() => setMode("dropoff")}
              label={c.dropoffMode}
            />
          </div>
          <p className="text-sm leading-6 text-muted">{c.helper}</p>
        </>
      ) : null}

      <div className="relative h-72 overflow-hidden rounded-3xl border border-line">
        {/* Pan/zoom is always enabled so viewers can explore the route; `interactive`
            only gates editing (placing/dragging pins). */}
        <Map
          initialViewState={initialViewState}
          mapStyle={MAP_STYLE}
          interactive
          cursor={interactive ? "crosshair" : "grab"}
          onClick={interactive ? handleMapClick : undefined}
          style={{ width: "100%", height: "100%" }}
        >
          {pickup && dropoff && routeGeoJson ? (
            <Source id="trip-route" type="geojson" data={routeGeoJson}>
              <Layer
                id="trip-route-line"
                type="line"
                layout={{ "line-cap": "round", "line-join": "round" }}
                paint={{ "line-color": "#f97316", "line-width": 4 }}
              />
            </Source>
          ) : null}

          {pickup ? (
            <Marker
              longitude={pickup.lng}
              latitude={pickup.lat}
              anchor="bottom"
              draggable={interactive}
              onDragEnd={interactive ? handleDragEnd("pickup") : undefined}
            >
              <PinBadge label={c.pickupMarker} color="#059669" />
            </Marker>
          ) : null}

          {dropoff ? (
            <Marker
              longitude={dropoff.lng}
              latitude={dropoff.lat}
              anchor="bottom"
              draggable={interactive}
              onDragEnd={interactive ? handleDragEnd("dropoff") : undefined}
            >
              <PinBadge label={c.dropoffMarker} color="#b91c1c" />
            </Marker>
          ) : null}
        </Map>

        {geocoding ? (
          <div className="pointer-events-none absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-xs font-medium text-foreground shadow">
            {c.geocoding}
          </div>
        ) : null}
      </div>
    </div>
  );
}

function ModeButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
        active
          ? "bg-accent text-white"
          : "border border-line text-foreground hover:border-accent hover:text-accent"
      }`}
    >
      {label}
    </button>
  );
}

function PinBadge({ label, color }: { label: string; color: string }) {
  return (
    <div className="flex translate-y-1 flex-col items-center">
      <span
        className="rounded-full px-2 py-0.5 text-[11px] font-semibold text-white shadow"
        style={{ backgroundColor: color }}
      >
        {label}
      </span>
      <span
        className="-mt-0.5 h-3 w-3 rotate-45 border border-white shadow"
        style={{ backgroundColor: color }}
      />
    </div>
  );
}
