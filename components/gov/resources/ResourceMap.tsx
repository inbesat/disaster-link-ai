"use client";

// ---------------------------------------------------------------------
// components/gov/resources/ResourceMap.tsx — Phase 10 · Step 2 ·
// Resource Map View (MapLibre GL).
//
// Plots the shared RESOURCE_INVENTORY dataset on a dark MapLibre canvas:
// one emoji pin per item, marker ring colour-coded by status (green =
// available, amber = deployed, red = maintenance). Clicking a pin opens
// a popup with the item's quantity and EXACT WGS84 coordinates.
//
// Loaded client-only (ssr: false) from the page — maplibre-gl touches
// `window`, per the codebase-wide convention for map canvases.
// ---------------------------------------------------------------------

import { useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import { Map, Marker, Popup } from "react-map-gl/maplibre";
import {
  CATEGORY_META,
  RESOURCE_INVENTORY,
  STATUS_META,
  formatQuantity,
  type ResourceItem,
} from "@/lib/mock-data/resource-inventory";

const MAP_STYLE = "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json";

/** Patna / Punpun theatre — fits the whole dataset at a glance. */
const INITIAL_VIEW = {
  longitude: 85.12,
  latitude: 25.53,
  zoom: 10.2,
};

/** The emoji pin. Ring colour is driven by the item's status. */
function ResourcePin({
  item,
  selected,
  onClick,
}: {
  item: ResourceItem;
  selected: boolean;
  onClick: () => void;
}) {
  const statusHex = STATUS_META[item.status].hex;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`${item.name}, ${formatQuantity(item)}, ${item.status}`}
      aria-pressed={selected}
      className={`flex h-9 w-9 items-center justify-center rounded-full text-base leading-none transition-transform duration-150 active:scale-90 ${
        selected ? "scale-125" : "hover:scale-110"
      }`}
      style={{
        backgroundColor: `${statusHex}26`,
        boxShadow: selected
          ? `0 0 0 3px rgba(255,255,255,0.9), 0 0 0 6px ${statusHex}, 0 4px 14px rgba(0,0,0,0.5)`
          : `0 0 0 2px ${statusHex}, 0 4px 14px rgba(0,0,0,0.5)`,
      }}
    >
      <span aria-hidden="true">{CATEGORY_META[item.category].emoji}</span>
    </button>
  );
}

export function ResourceMap() {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = RESOURCE_INVENTORY.find((r) => r.id === selectedId) ?? null;

  return (
    <div className="relative h-full w-full overflow-hidden rounded-xl border border-white/10">
      <Map
        mapLib={maplibregl}
        mapStyle={MAP_STYLE}
        initialViewState={INITIAL_VIEW}
        style={{ width: "100%", height: "100%" }}
        attributionControl={false}
        onClick={() => setSelectedId(null)}
      >
        {RESOURCE_INVENTORY.map((item) => (
          <Marker
            key={item.id}
            longitude={item.lng}
            latitude={item.lat}
            anchor="center"
            onClick={(e) => {
              e.originalEvent.stopPropagation();
              setSelectedId(item.id);
            }}
          >
            <ResourcePin
              item={item}
              selected={item.id === selectedId}
              onClick={() => setSelectedId(item.id)}
            />
          </Marker>
        ))}

        {selected && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            anchor="bottom"
            closeButton={false}
            onClose={() => setSelectedId(null)}
            offset={16}
          >
            <div className="w-56 font-sans">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-bold leading-tight text-slate-900">
                  {selected.name}
                </p>
                <span aria-hidden="true" className="text-lg">
                  {CATEGORY_META[selected.category].emoji}
                </span>
              </div>
              <p className="mt-0.5 text-[0.6875rem] uppercase tracking-wider text-slate-500">
                {CATEGORY_META[selected.category].label} · {selected.location}
              </p>

              <div className="mt-2.5 space-y-1.5 rounded-md bg-slate-100 p-2">
                <Row label="Quantity" value={formatQuantity(selected)} />
                <Row
                  label="Status"
                  value={STATUS_META[selected.status].label}
                  dotClass={STATUS_META[selected.status].dot}
                />
                <Row
                  label="Coordinates"
                  value={`${selected.lat.toFixed(5)}, ${selected.lng.toFixed(5)}`}
                  mono
                />
              </div>

              <p className="mt-2 flex items-center gap-1 text-[0.625rem] text-slate-500">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${STATUS_META[selected.status].dot}`}
                  aria-hidden
                />
                Assigned to {selected.assignedTo}
              </p>
            </div>
          </Popup>
        )}
      </Map>

      {/* Legend */}
      <div className="pointer-events-none absolute bottom-3 left-3 z-10 rounded-lg border border-white/10 bg-panel-deep/90 px-3 py-2 backdrop-blur">
        <p className="text-[0.5625rem] font-bold uppercase tracking-[0.2em] text-slate-500">
          Status
        </p>
        <ul className="mt-1.5 flex flex-col gap-1">
          {(["available", "deployed", "maintenance"] as const).map((status) => (
            <li
              key={status}
              className="flex items-center gap-1.5 text-[0.6875rem] text-slate-300"
            >
              <span
                aria-hidden
                className="h-2 w-2 rounded-full"
                style={{ backgroundColor: STATUS_META[status].hex }}
              />
              {STATUS_META[status].label}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Row({
  label,
  value,
  mono,
  dotClass,
}: {
  label: string;
  value: string;
  mono?: boolean;
  dotClass?: string;
}) {
  return (
    <p className="flex items-center justify-between gap-2 text-[0.6875rem]">
      <span className="text-slate-500">{label}</span>
      <span
        className={`flex items-center gap-1.5 font-semibold text-slate-800 ${
          mono ? "font-mono tabular-nums" : ""
        }`}
      >
        {dotClass && (
          <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
        )}
        {value}
      </span>
    </p>
  );
}

export default ResourceMap;
