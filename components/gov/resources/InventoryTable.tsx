"use client";

// ---------------------------------------------------------------------
// components/gov/resources/InventoryTable.tsx — Resource Inventory Table.
//
// Data-dense TanStack Table with:
//   • Columns: Type (icon+label), Quantity, Location, Status badge,
//     Assigned To, Last Updated — all sortable
//   • Filter bar: type dropdown, status dropdown, location search
//   • Row actions: Edit, Deploy, Delete (with confirmation modal)
//   • Pagination: 25 rows per page
//   • Sticky header, alternating row backgrounds
// ---------------------------------------------------------------------

import { useMemo, useState } from "react";
import {
  createColumnHelper,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type Column,
  type SortingState,
} from "@tanstack/react-table";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Clock,
  Edit3,
  MapPin,
  Search,
  Send,
  Ship,
  Stethoscope,
  Tent,
  Trash2,
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

const CATEGORY_ICONS: Record<ResourceCategory, typeof Ship> = {
  boat: Ship,
  medical: Stethoscope,
  food: UtensilsCrossed,
  tent: Tent,
};

const STATUS_CHIP: Record<ResourceStatus, string> = {
  available:
    "border-emerald-400/40 bg-emerald-400/10 text-emerald-400",
  deployed:
    "border-amber-400/40 bg-amber-400/10 text-amber-400",
  maintenance: "border-red-400/40 bg-red-400/10 text-red-400",
};

const ROWS_PER_PAGE = 25;

// ---------------------------------------------------------------------
// Confirmation Modal
// ---------------------------------------------------------------------

function ConfirmModal({
  open,
  title,
  message,
  confirmLabel,
  confirmVariant,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  confirmVariant: "danger" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-[#111827] p-6 shadow-2xl">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-400/10">
            <AlertTriangle className="h-5 w-5 text-red-400" aria-hidden />
          </span>
          <h3 className="text-lg font-bold text-white">{title}</h3>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-slate-400">{message}</p>
        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-xl border border-white/10 px-4 py-2 text-sm font-semibold text-slate-400 transition hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={`rounded-xl px-4 py-2 text-sm font-bold transition ${
              confirmVariant === "danger"
                ? "bg-red-500 text-white hover:bg-red-400"
                : "bg-blue-600 text-white hover:bg-blue-500"
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------
// Toolbar controls
// ---------------------------------------------------------------------

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
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search resources…"
        className="h-10 w-full rounded-lg border border-white/10 bg-[#0a0f1a] pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/30 focus:outline-none"
      />
    </label>
  );
}

function SelectColumnFilter<T>({
  column,
  allOptionLabel,
}: {
  column: Column<T, unknown>;
  allOptionLabel: string;
}) {
  const filterValue = (column.getFilterValue() ?? "") as string;
  const options = Array.from(column.getFacetedUniqueValues().keys()).sort((a, b) =>
    String(a).localeCompare(String(b)),
  );

  return (
    <select
      aria-label={`Filter by ${String(column.columnDef.header).toLowerCase()}`}
      value={filterValue}
      onChange={(e) => column.setFilterValue(e.target.value || undefined)}
      className="h-10 rounded-lg border border-white/10 bg-[#0a0f1a] px-3 text-sm text-white focus:border-purple-400/60 focus:ring-2 focus:ring-purple-400/30 focus:outline-none [&>option]:bg-[#111827]"
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
  const [deleteTarget, setDeleteTarget] = useState<ResourceItem | null>(null);

  const columns = useMemo(
    () => [
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
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-purple-400/30 bg-purple-400/10">
                <Icon aria-hidden="true" className="h-4 w-4 text-purple-400" />
              </span>
              <div>
                <p className="font-semibold text-white">{row.original.name}</p>
                <p className="text-[0.6875rem] uppercase tracking-wider text-slate-500">
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
            <span className="ml-1 text-[0.6875rem] text-slate-500">{row.original.unit}</span>
          </span>
        ),
      }),
      columnHelper.accessor((row) => row.location, {
        id: "location",
        header: "Location",
        cell: ({ row }) => (
          <span className="inline-flex items-center gap-1.5 text-slate-300">
            <MapPin className="h-3 w-3 text-slate-500" aria-hidden />
            {row.original.location}
          </span>
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
          <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-500">
            <Clock className="h-3 w-3" aria-hidden />
            {row.original.lastUpdated}
          </span>
        ),
      }),
      columnHelper.display({
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <button
              type="button"
              title="Edit resource"
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-blue-400"
            >
              <Edit3 className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              title="Deploy resource"
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-emerald-400"
            >
              <Send className="h-3.5 w-3.5" aria-hidden />
            </button>
            <button
              type="button"
              title="Delete resource"
              onClick={() => setDeleteTarget(row.original)}
              className="rounded-lg p-1.5 text-slate-500 transition hover:bg-white/5 hover:text-red-400"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
            </button>
          </div>
        ),
      }),
    ],
    [],
  );

  const table = useReactTable({
    data: RESOURCE_INVENTORY,
    columns,
    initialState: { columnVisibility: { category: false }, pagination: { pageSize: ROWS_PER_PAGE } },
    state: { globalFilter, sorting, rowSelection },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    globalFilterFn: "includesString",
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const filteredCount = table.getFilteredRowModel().rows.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const totalPages = table.getPageCount();
  const hasActiveFilters = Boolean(
    globalFilter ||
    table.getColumn("category")?.getFilterValue() ||
    table.getColumn("status")?.getFilterValue(),
  );

  return (
    <section className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#111827]">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-3 border-b border-white/10 bg-[#0a0f1a]/80 px-4 py-3 backdrop-blur-md">
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
              className="inline-flex h-10 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-xs font-semibold text-slate-400 transition hover:border-purple-400/50 hover:text-purple-400"
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
          <thead className="sticky top-0 z-10 bg-[#0a0f1a]">
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
                          className="group inline-flex items-center gap-1.5 text-[0.625rem] font-bold uppercase tracking-[0.15em] text-slate-500 transition hover:text-white"
                        >
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                          <SortIcon
                            aria-hidden
                            className={`h-3.5 w-3.5 transition ${
                              sorted
                                ? "text-purple-400"
                                : "opacity-40 group-hover:opacity-100"
                            }`}
                          />
                        </button>
                      ) : (
                        <span className="text-[0.625rem] font-bold uppercase tracking-[0.15em] text-slate-500">
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
                  className="px-4 py-16 text-center text-sm text-slate-500"
                >
                  No resources match the current search / filters.
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row, rowIndex) => (
                <tr
                  key={row.id}
                  className={`border-b border-white/5 transition-colors last:border-0 hover:bg-white/[0.03] ${
                    rowIndex % 2 === 1 ? "bg-white/[0.015]" : ""
                  }`}
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

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-white/10 bg-[#0a0f1a]/80 px-4 py-2.5 backdrop-blur-md">
        <p className="text-[0.6875rem] uppercase tracking-wider text-slate-500">
          Showing{" "}
          <span className="font-bold text-white">
            {pageIndex * ROWS_PER_PAGE + 1}–
            {Math.min((pageIndex + 1) * ROWS_PER_PAGE, filteredCount)}
          </span>{" "}
          of <span className="font-bold text-white">{filteredCount}</span> resources
        </p>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" aria-hidden />
          </button>
          <span className="px-2 font-mono text-xs text-slate-400">
            {pageIndex + 1}/{totalPages}
          </span>
          <button
            type="button"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
            className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 text-slate-400 transition hover:bg-white/5 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" aria-hidden />
          </button>
        </div>
      </div>

      {/* Delete confirmation modal */}
      <ConfirmModal
        open={deleteTarget !== null}
        title="Delete Resource"
        message={`Are you sure you want to delete "${deleteTarget?.name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        confirmVariant="danger"
        onConfirm={() => {
          setDeleteTarget(null);
        }}
        onCancel={() => setDeleteTarget(null)}
      />
    </section>
  );
}

export default InventoryTable;
