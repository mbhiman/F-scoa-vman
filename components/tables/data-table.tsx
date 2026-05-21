"use client";

import {
    useReactTable,
    getCoreRowModel,
    getFilteredRowModel,
    getPaginationRowModel,
    getSortedRowModel,
    flexRender,
    type ColumnDef,
    type SortingState,
    type ColumnFiltersState,
    type VisibilityState,
} from "@tanstack/react-table";
import { useState, useRef, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
    ChevronUp, ChevronDown, ChevronsUpDown,
    ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight,
    Search, SlidersHorizontal, X
} from "lucide-react";

// --- Custom Animated Dropdown adapted for Admin UI ---
function AdminFancyDropdown({
    ariaLabel,
    value,
    onChange,
    options,
    placeholder = "Select...",
}: {
    ariaLabel: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
}) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const active = options.find((o) => o.value === value) ?? { label: placeholder, value: "" };

    useEffect(() => {
        const listener = (event: MouseEvent | TouchEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
        };
        document.addEventListener("mousedown", listener);
        document.addEventListener("touchstart", listener, { passive: true });
        return () => {
            document.removeEventListener("mousedown", listener);
            document.removeEventListener("touchstart", listener);
        };
    }, []);

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === "Escape") setOpen(false);
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
    }, [open]);

    return (
        <div ref={rootRef} className="relative w-full">
            <motion.button
                type="button"
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setOpen((v) => !v)}
                aria-label={ariaLabel}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={`group flex h-10 w-full items-center justify-between gap-3 rounded-lg border bg-admin-card px-3 text-left transition-[border-color,box-shadow,background-color] duration-200 border-admin-border shadow-sm hover:border-admin-primary/50 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-admin-primary/20 ${open ? "border-admin-primary shadow-md ring-2 ring-admin-primary/15" : ""}`}
            >
                <span className={`truncate text-[13px] font-medium ${value ? "text-admin-fg" : "text-admin-muted-foreground"}`}>
                    {active.label}
                </span>
                <span className="flex items-center text-admin-muted-foreground transition-colors group-hover:text-admin-fg">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" className={`transition-transform duration-200 ${open ? "rotate-180" : ""}`}>
                        <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                </span>
            </motion.button>

            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.985 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 4, scale: 0.985 }}
                        transition={{ duration: 0.17, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="absolute left-0 right-0 z-50 mt-1.5 w-full origin-top overflow-hidden rounded-xl border border-admin-border bg-admin-card/95 shadow-[0_22px_48px_-20px_rgba(0,0,0,0.38)] backdrop-blur-md"
                        role="listbox"
                    >
                        <div className="max-h-60 overflow-auto p-1.5 custom-scrollbar">
                            {options.map((opt) => {
                                const selected = opt.value === value;
                                return (
                                    <button
                                        key={opt.value || "__all"}
                                        type="button"
                                        role="option"
                                        aria-selected={selected}
                                        onClick={() => { onChange(opt.value); setOpen(false); }}
                                        className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-[background-color,color,transform] duration-150 hover:bg-admin-primary/10 hover:text-admin-fg active:scale-[0.99] ${selected ? "bg-admin-primary/10 font-semibold text-admin-primary" : "text-admin-fg"}`}
                                    >
                                        <span className="truncate">{opt.label}</span>
                                        {selected && (
                                            <span className="text-admin-primary">
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                                                    <path d="M20 6 9 17l-5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                                </svg>
                                            </span>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// --- Main Data Table Component ---
interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    searchKey?: string;
    searchPlaceholder?: string;
    title?: string;
    description?: string;
    actions?: React.ReactNode;
    isLoading?: boolean;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    searchKey,
    searchPlaceholder = "Search...",
    title,
    description,
    actions,
    isLoading = false,
}: DataTableProps<TData, TValue>) {
    const [sorting, setSorting] = useState<SortingState>([]);
    const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
    const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({});
    const [rowSelection, setRowSelection] = useState({});

    // UI State for toggling the filter drawer
    const [showFilters, setShowFilters] = useState(false);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        getSortedRowModel: getSortedRowModel(),
        getFilteredRowModel: getFilteredRowModel(),
        onSortingChange: setSorting,
        onColumnFiltersChange: setColumnFilters,
        onColumnVisibilityChange: setColumnVisibility,
        onRowSelectionChange: setRowSelection,
        state: { sorting, columnFilters, columnVisibility, rowSelection },
        initialState: { pagination: { pageSize: 10 } },
    });

    const selectedCount = Object.keys(rowSelection).length;
    const activeFiltersCount = columnFilters.filter(f => f.id !== searchKey).length;

    return (
        <div className="rounded-xl border border-admin-border bg-admin-card shadow-sm overflow-hidden">
            {/* Top Bar (Title, Search, Action Buttons) */}
            {(title || actions || searchKey) && (
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-5 py-4 border-b border-admin-border bg-admin-bg">

                    {/* Header Title area */}
                    <div className="flex-1 min-w-0">
                        {title && (
                            <h3 className="text-sm font-semibold text-admin-fg">
                                {title}
                            </h3>
                        )}
                        {description && (
                            <p className="text-xs mt-0.5 text-admin-muted-foreground">
                                {description}
                            </p>
                        )}
                    </div>

                    {/* Actions & Search area */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">

                        {searchKey && (
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-admin-border bg-admin-card text-sm focus-within:border-admin-primary focus-within:ring-2 focus-within:ring-admin-primary/20 transition-all">
                                <Search className="w-3.5 h-3.5 text-admin-muted-foreground shrink-0" />
                                <input
                                    className="bg-transparent outline-none w-full sm:w-48 text-admin-fg placeholder:text-admin-muted"
                                    placeholder={searchPlaceholder}
                                    value={(table.getColumn(searchKey)?.getFilterValue() as string) ?? ""}
                                    onChange={(e) => table.getColumn(searchKey)?.setFilterValue(e.target.value)}
                                />
                            </div>
                        )}

                        <div className="flex items-center justify-between sm:justify-start gap-3 w-full sm:w-auto mt-1 sm:mt-0">
                            <div className="flex items-center gap-2">
                                {selectedCount > 0 && (
                                    <span className="text-[11px] px-2.5 py-1 rounded bg-admin-primary/10 text-admin-primary font-bold">
                                        {selectedCount} selected
                                    </span>
                                )}

                                <button
                                    onClick={() => setShowFilters(!showFilters)}
                                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md border text-xs font-medium transition-colors ${showFilters || activeFiltersCount > 0 ? 'bg-admin-muted/10 border-admin-muted/30 text-admin-fg' : 'border-admin-border text-admin-muted-foreground hover:bg-admin-muted/5'}`}
                                >
                                    <SlidersHorizontal className="w-3.5 h-3.5" />
                                    Filters
                                    {activeFiltersCount > 0 && (
                                        <span className="flex items-center justify-center w-4 h-4 ml-1 text-[10px] text-white bg-admin-primary rounded-full">
                                            {activeFiltersCount}
                                        </span>
                                    )}
                                </button>
                            </div>

                            {actions}
                        </div>
                    </div>
                </div>
            )}

            {/* Expandable Filter Drawer using the new Fancy Dropdowns */}
            {showFilters && (
                <div className="px-5 py-4 border-b border-admin-border bg-admin-bg/50 flex flex-col sm:flex-row gap-4 sm:items-end animate-in fade-in slide-in-from-top-2 duration-200">

                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        {/* Status Filter */}
                        <div className="flex flex-col gap-1.5 w-full sm:w-48">
                            <label className="text-[11px] font-bold text-admin-muted-foreground uppercase tracking-wider">Status</label>
                            <AdminFancyDropdown
                                ariaLabel="Filter by status"
                                value={(table.getColumn("status")?.getFilterValue() as string) ?? ""}
                                onChange={(val) => table.getColumn("status")?.setFilterValue(val || undefined)}
                                options={[
                                    { value: "", label: "All Status" },
                                    { value: "PUBLISHED", label: "Published" },
                                    { value: "DRAFT", label: "Draft" },
                                    { value: "DISABLED", label: "Disabled" },
                                ]}
                            />
                        </div>

                        {/* Course Type Filter */}
                        <div className="flex flex-col gap-1.5 w-full sm:w-48">
                            <label className="text-[11px] font-bold text-admin-muted-foreground uppercase tracking-wider">Course Type</label>
                            <AdminFancyDropdown
                                ariaLabel="Filter by course type"
                                value={(table.getColumn("isNcvet")?.getFilterValue() !== undefined ? String(table.getColumn("isNcvet")?.getFilterValue()) : "")}
                                onChange={(val) => table.getColumn("isNcvet")?.setFilterValue(val === "" ? undefined : val === "true")}
                                options={[
                                    { value: "", label: "All Types" },
                                    { value: "true", label: "NCVET Certified" },
                                    { value: "false", label: "Standard" },
                                ]}
                            />
                        </div>
                    </div>

                    {/* Clear Filters Action */}
                    {activeFiltersCount > 0 && (
                        <div className="flex items-end mt-2 sm:mt-0 pb-0.5">
                            <button
                                onClick={() => {
                                    table.getColumn("status")?.setFilterValue(undefined);
                                    table.getColumn("isNcvet")?.setFilterValue(undefined);
                                }}
                                className="w-full sm:w-auto flex items-center justify-center gap-1.5 px-4 sm:px-2 py-2.5 sm:py-1.5 rounded-md border border-admin-border sm:border-transparent bg-admin-card sm:bg-transparent text-xs font-medium text-red-500 hover:bg-red-500/10 transition-colors"
                            >
                                <X className="w-4 h-4 sm:w-3.5 sm:h-3.5" /> Clear Filters
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* Table Area */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <tr key={headerGroup.id} className="border-b border-admin-border bg-admin-bg/30">
                                {headerGroup.headers.map((header) => (
                                    <th key={header.id} className="px-5 py-3 text-left whitespace-nowrap">
                                        {header.isPlaceholder ? null : (
                                            <div
                                                className={`flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-admin-muted-foreground select-none ${header.column.getCanSort() ? "cursor-pointer hover:text-admin-fg transition-colors" : ""}`}
                                                onClick={header.column.getToggleSortingHandler()}
                                            >
                                                {flexRender(header.column.columnDef.header, header.getContext())}
                                                {header.column.getCanSort() && (
                                                    <span className="ml-1 text-admin-muted-foreground">
                                                        {header.column.getIsSorted() === "asc" ? (
                                                            <ChevronUp className="w-3.5 h-3.5 text-admin-primary" />
                                                        ) : header.column.getIsSorted() === "desc" ? (
                                                            <ChevronDown className="w-3.5 h-3.5 text-admin-primary" />
                                                        ) : (
                                                            <ChevronsUpDown className="w-3.5 h-3.5 opacity-30" />
                                                        )}
                                                    </span>
                                                )}
                                            </div>
                                        )}
                                    </th>
                                ))}
                            </tr>
                        ))}
                    </thead>
                    <tbody>
                        {isLoading ? (
                            <tr>
                                <td colSpan={columns.length} className="py-24 text-center text-sm text-admin-muted-foreground">
                                    <div className="flex flex-col items-center justify-center">
                                        <div className="w-6 h-6 border-2 border-admin-primary border-t-transparent rounded-full animate-spin mb-3"></div>
                                        Fetching data...
                                    </div>
                                </td>
                            </tr>
                        ) : table.getRowModel().rows.length ? (
                            table.getRowModel().rows.map((row) => (
                                <tr key={row.id} className="hover:bg-admin-muted/5 transition-colors border-b border-admin-border last:border-0 group">
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-5 py-4 text-admin-fg align-middle">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columns.length} className="py-24 text-center text-sm text-admin-muted-foreground flex flex-col items-center justify-center">
                                    <div className="bg-admin-muted/10 p-4 rounded-full mb-3">
                                        <Search className="w-6 h-6 text-admin-muted-foreground/50" />
                                    </div>
                                    <p className="font-medium text-admin-fg">No results found</p>
                                    <p className="text-xs mt-1">Try adjusting your filters or search query.</p>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-admin-border bg-admin-bg gap-4">
                <p className="text-[12px] sm:text-[13px] text-admin-muted-foreground text-center sm:text-left w-full sm:w-auto">
                    Showing <span className="font-medium text-admin-fg">{table.getFilteredRowModel().rows.length > 0 ? table.getState().pagination.pageIndex * table.getState().pagination.pageSize + 1 : 0}</span>–
                    <span className="font-medium text-admin-fg">{Math.min((table.getState().pagination.pageIndex + 1) * table.getState().pagination.pageSize, table.getFilteredRowModel().rows.length)}</span>{" "}
                    of <span className="font-medium text-admin-fg">{table.getFilteredRowModel().rows.length}</span> results
                </p>
                <div className="flex items-center gap-1.5 w-full sm:w-auto justify-center sm:justify-end">
                    {[
                        { icon: ChevronsLeft, action: () => table.setPageIndex(0), disabled: !table.getCanPreviousPage() },
                        { icon: ChevronLeft, action: () => table.previousPage(), disabled: !table.getCanPreviousPage() },
                        { icon: ChevronRight, action: () => table.nextPage(), disabled: !table.getCanNextPage() },
                        { icon: ChevronsRight, action: () => table.setPageIndex(table.getPageCount() - 1), disabled: !table.getCanNextPage() },
                    ].map(({ icon: Icon, action, disabled }, i) => (
                        <button
                            key={i}
                            onClick={action}
                            disabled={disabled}
                            className="w-8 h-8 flex items-center justify-center rounded-md border border-admin-border text-admin-muted-foreground hover:bg-admin-muted/10 hover:text-admin-fg transition-colors disabled:opacity-30 disabled:pointer-events-none"
                        >
                            <Icon className="w-4 h-4" />
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}