"use client";

// ---------------------------------------------------------------------
// components/gov/resources/InventoryTable.tsx — Phase 10 · Step 1 ·
// Resource Inventory Dashboard (TanStack Table).
//
// District-wide resource ledger on a dark tactical theme. Powered by
// @tanstack/react-table (v8): sortable headers, a global search box, and
// per-column select filters (Type, Status) driven by faceted unique
// values — the dropdowns only list values actually present in the data.
// Data comes from lib/mock-data/resource-inventory.ts (shared with the
// Step 2 map view so both panes stay in sync).
// ---------------------------------------------------------------------

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowDown,
  ArrowUp,
  ChevronsUpDown,
  Search,
  Ship,
  Stethoscope,
  Tent,
  UtensilsCrossed,
  X,
} from "lucide-react";
import {
  CATEGORY_META,
  RESOURCE_INVENTORY,
  STATUS_META,
  type ResourceCategory,
  type ResourceItem,
  type ResourceStatus,
} from "@/lib/mock-data/resource-inventory";

/** Lucide icon per category (table cell) — purple accent. */
const CATEGORY_ICONS: Record<ResourceCategory, typeof Ship> = {
  boat: Ship,
  medical: Stethoscope,
  food: UtensilsCrossed,
  tent: Tent,
};

const STATUS_CHIP: Record<ResourceStatus, string> = {
  available:
    "border-severity-green-500/40 bg-severity-green-500/10 text-severity-green-300",
  deployed:
    "border-severity-amber-500/40 bg-severity-amber-500/10 text-severity-amber-300",
  maintenance: "border-severity-red-500/40 bg-severity-red-500/10 text-severity-red-300",
};

// ---------------------------------------------------------------------
// Toolbar controls
// ---------------------------------------------------------------------

/** Global search input. */
function GlobalSearch({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="relative block">
      <Search
        aria-hidden="true"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search resources… (name, location, agency)"
        className="h-10 w-full rounded-lg border border-white/10 bg-white/5 pl-9 pr-3 text-sm text-white placeholder:text-muted focus:border-accent-purple/60 focus:outline-none"
      />
    </label>
  );
}

/** Select column filter — options are the faceted unique values. */
function SelectColumnFilter<T>({
  column,
  allOptionLabel,
}: {
  column: Column<T, unknown>;
  allOptionLabel: string;
}) {
  const filterValue = (column.getFilterValue() ?? "") as string;
  // getFacetedUniqueValues is already memoized by TanStack, so calling it
  // in render is cheap and always current.
  const options = Array.from(column.getFacetedUniqueValues().keys()).sort((a, b) =>
    String(a).localeCompare(String(b)),
  );

  return (
    <select
      aria-label={`Filter by ${String(column.columnDef.header).toLowerCase()}`}
      value={filterValue}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      className="h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white focus:border-accent-purple/60 focus:outline-none [&>option]:bg-panel-deep"
    >
      <option value="">{allOptionLabel}</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  );
}

// ---------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------

const columnHelper = createColumnHelper<ResourceItem>();

export function InventoryTable() {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([{ id: "status", desc: false }]);
  const [rowSelection] = useState({});

  const columns = useMemo(
    () => [
      // Hidden column — the "Type" filter facets on the CATEGORY label
      // (Boats / Medical Kits / Food Rations / Tents), not the free-text
      // item name, so one dropdown groups all boats together.
      columnHelper.accessor((row) => CATEGORY_META[row.category].label, {
        id: "category",
        header: "Type",
        enableSorting: false,
        enableHiding: true,
      }),
      columnHelper.accessor((row) => row.name, {
        id: "name",
        header: "Type",
        cell: ({ row }) => {
          const Icon = CATEGORY_ICONS[row.original.category];
          return (
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-accent-purple/30 bg-accent-purple/10">
                <Icon aria-hidden="true" className="h-4 w-4 text-accent-purple" />
              </span>
              <div>
                <p className="font-semibold text-white">{row.original.name}</p>
                <p className="text-[0.6875rem] uppercase tracking-wider text-muted">
                  {CATEGORY_META[row.original.category].label}
                </p>
              </div>
            </div>
          );
        },
      }),
      columnHelper.accessor((row) => row.quantity, {
        id: "quantity",
        header: "Quantity",
        cell: ({ row }) => (
          <span className="font-mono tabular-nums text-white">
            {row.original.quantity.toLocaleString("en-IN")}
            <span className="ml-1 text-[0.6875rem] text-muted">{row.original.unit}</span>
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.location, {
        id: "location",
        header: "Location",
        cell: ({ row }) => (
          <span className="text-slate-300">{row.original.location}</span>
        ),
      }),
      columnHelper.accessor((row) => row.status, {
        id: "status",
        header: "Status",
        cell: ({ row }) => {
          const status = row.original.status;
          return (
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[0.625rem] font-bold uppercase tracking-wider ${STATUS_CHIP[status]}`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${STATUS_META[status].dot}`}
                aria-hidden
              />
              {STATUS_META[status].label}
            </span>
          );
        },
      }),
      columnHelper.accessor((row) => row.assignedTo, {
        id: "assignedTo",
        header: "Assigned To",
        cell: ({ row }) => (
          <span className="text-slate-300">{row.original.assignedTo}</span>
        ),
      }),
      columnHelper.accessor((row) => row.lastUpdated, {
        id: "lastUpdated",
        header: "Last Updated",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted">{row.original.lastUpdated}</span>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: RESOURCE_INVENTORY,
    columns,
    initialState: { columnVisibility: { category: false } },
    state: { globalFilter, sorting, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  // Boolean() — getFilterValue() returns unknown, and an `a || b && <x>`
  // chain would type the left side as `unknown`, which isn't a ReactNode.
  const hasActiveFilters = Boolean(
    globalFilter ||
    table.getColumn("category")?.getFilterValue() ||
    table.getColumn("status")?.getFilterValue(),
  );

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-secondary">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-panel-deep px-4 py-3">
        <div className="min-w-[220px] flex-1">
          <GlobalSearch value={globalFilter} onChange={setGlobalFilter} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SelectColumnFilter
            column={table.getColumn("category")!}
            allOptionLabel="All types"
          />
          <SelectColumnFilter
            column={table.getColumn("status")!}
            allOptionLabel="All statuses"
          />
          {hasActiveFilters && (
            <button
              type="button"
              onClick={() => {
                setGlobalFilter("");
                table.getColumn("category")?.setFilterValue(undefined);
                table.getColumn("status")?.setFilterValue(undefined);
              }}
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-300 transition hover:border-accent-purple/50 hover:text-accent-purple"
            >
              <X aria-hidden className="h-3.5 w-3.5" />
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-sm">
          <thead className="sticky top-0 z-10 bg-panel-deep">
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const sorted = header.column.getIsSorted();
                  const SortIcon =
                    sorted === "asc"
                      ? ArrowUp
                      : sorted === "desc"
                        ? ArrowDown
                        : ChevronsUpDown;
                  return (
                    <th
                      key={header.id}
                      className="whitespace-nowrap border-b border-white/10 px-4 py-3 text-left"
                    >
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          onClick={header.column.getToggleSortingHandler()}
                          className="group inline-flex items-center gap-1.5 text-[0.625rem] font-bold uppercase tracking-[0.15em] text-muted transition hover:text-white"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <SortIcon
                            aria-hidden
                            className={`h-3.5 w-3.5 transition ${
                              sorted
                                ? "text-accent-purple"
                                : "opacity-40 group-hover:opacity-100"
                            }`}
                          />
                        </button>
                      ) : (
                        <span className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-muted">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                        </span>
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {table.getRowModel().rows.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length}
                  className="px-4 py-16 text-center text-sm text-muted"
                >
                  No resources match the current search / filters.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03]"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="whitespace-nowrap px-4 py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-white/10 bg-panel-deep px-4 py-2.5">
        <p className="text-[0.6875rem] uppercase tracking-wider text-muted">
          Showing <span className="font-bold text-white">{filteredCount}</span> of{" "}
          {RESOURCE_INVENTORY.length} district assets
        </p>
        <p className="hidden font-mono text-[0.625rem] uppercase tracking-[0.2em] text-slate-600 sm:block">
          Inventory feed · live sync
        </p>
      </div>
    </section>
  );
}

export default InventoryTable;
