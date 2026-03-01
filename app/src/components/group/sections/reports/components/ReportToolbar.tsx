import { useState, useRef, useEffect } from "react";
import { Dropdown, Tooltip } from "@/components/shared";
import type {
  ColumnKey,
  GroupByKey,
  ReportStatusFilter,
} from "@/components/group/sections/reports/types";

interface ReportToolbarProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;

  visibleColumns: ColumnKey[];
  setVisibleColumns: (cols: ColumnKey[]) => void;
  groupBy: GroupByKey;
  setGroupBy: (key: GroupByKey) => void;
  statusFilter: ReportStatusFilter;
  setStatusFilter: (filter: ReportStatusFilter) => void;
  search: string;
  setSearch: (val: string) => void;

  allColumns: ReadonlyArray<{ key: ColumnKey; label: string }>;
  defaultColumns: ColumnKey[];
}

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
] as const;

const GROUP_OPTIONS = [
  { value: "none", label: "None" },
  { value: "person", label: "Person" },
  { value: "date", label: "Date" },
] as const;

export function ReportToolbar({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  visibleColumns,
  setVisibleColumns,
  groupBy,
  setGroupBy,
  statusFilter,
  setStatusFilter,
  search,
  setSearch,
  allColumns,
}: ReportToolbarProps) {
  const [showOptions, setShowOptions] = useState(false);
  const [showFilter, setShowFilter] = useState(false);
  const optionsRef = useRef<HTMLDivElement>(null);
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        optionsRef.current &&
        !optionsRef.current.contains(event.target as Node)
      ) {
        setShowOptions(false);
      }
      if (
        filterRef.current &&
        !filterRef.current.contains(event.target as Node)
      ) {
        setShowFilter(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/5 flex-shrink-0">
      {/* ── Date Range ── */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <Tooltip content="Start date" position="bottom">
          <input
            type="date"
            value={startDate}
            onChange={(e) => onStartDateChange(e.target.value)}
            className="bg-white/[0.04] border border-white/5 rounded-lg px-2 py-1 text-[11px] font-bold text-white/75 cursor-pointer focus:outline-none focus:border-cyan-500/30 transition-all min-w-[110px]"
            style={
              {
                colorScheme: "dark",
                fieldSizing: "content",
              } as React.CSSProperties
            }
          />
        </Tooltip>
        <span className="text-[9px] font-black uppercase tracking-widest text-white/20 px-0.5">
          To
        </span>
        <Tooltip content="End date" position="bottom">
          <input
            type="date"
            value={endDate}
            onChange={(e) => onEndDateChange(e.target.value)}
            className="bg-white/[0.04] border border-white/5 rounded-lg px-2 py-1 text-[11px] font-bold text-white/75 cursor-pointer focus:outline-none focus:border-cyan-500/30 transition-all min-w-[110px]"
            style={
              {
                colorScheme: "dark",
                fieldSizing: "content",
              } as React.CSSProperties
            }
          />
        </Tooltip>
      </div>

      {/* ── Spacer ── */}
      <div className="flex-1" />

      {/* ── Right Controls ── */}
      <div className="flex items-center gap-2 flex-shrink-0">
        {/* Search */}
        <div className="relative">
          <i className="fa-solid fa-magnifying-glass absolute left-2.5 top-1/2 -translate-y-1/2 text-white/20 text-[9px]" />
          <input
            type="search"
            placeholder="Search…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-white/[0.04] border border-white/5 rounded-lg pl-7 pr-3 py-1.5 text-[11px] text-white placeholder:text-white/20 focus:outline-none focus:border-cyan-500/30 transition-all font-medium w-36 focus:w-52"
          />
        </div>

        {/* Filter — icon only */}
        <div className="relative" ref={filterRef}>
          <Tooltip
            content={
              statusFilter !== "all"
                ? `Filter: ${STATUS_OPTIONS.find((s) => s.value === statusFilter)?.label}`
                : "Filter"
            }
            position="bottom"
          >
            <button
              onClick={() => setShowFilter(!showFilter)}
              className={`relative flex items-center justify-center w-7 h-7 rounded-lg border transition-all ${
                showFilter || statusFilter !== "all"
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                  : "bg-white/[0.04] border-white/5 text-white/35 hover:text-white/60"
              }`}
            >
              <i className="fa-solid fa-filter text-[10px]" />
              {statusFilter !== "all" && (
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-cyan-400" />
              )}
            </button>
          </Tooltip>

          {showFilter && (
            <div className="absolute right-0 mt-2 w-36 bg-[#161616] border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden">
              {STATUS_OPTIONS.map(({ value: st, label }) => (
                <button
                  key={st}
                  onClick={() => {
                    setStatusFilter(st as ReportStatusFilter);
                    setShowFilter(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 text-[11px] font-bold transition-colors border-0 ${
                    statusFilter === st
                      ? "text-cyan-400 bg-cyan-500/10"
                      : "text-white/50 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Options — icon only */}
        <div className="relative" ref={optionsRef}>
          <Tooltip content="Options" position="bottom">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className={`flex items-center justify-center w-7 h-7 rounded-lg border transition-all ${
                showOptions
                  ? "bg-cyan-500/10 border-cyan-500/30 text-cyan-400"
                  : "bg-white/[0.04] border-white/5 text-white/35 hover:text-white/60"
              }`}
            >
              <i className="fa-solid fa-sliders text-[10px]" />
            </button>
          </Tooltip>

          {showOptions && (
            <div
              className="absolute right-0 mt-2 w-56 bg-[#161616] border border-white/10 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100 overflow-hidden flex flex-col"
              style={{ maxHeight: "360px" }}
            >
              {/* Columns */}
              <div className="px-3 pt-3 pb-2">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
                  Columns
                </span>
                <div
                  className="mt-1.5 overflow-y-auto custom-scroll"
                  style={{ maxHeight: "140px" }}
                >
                  {allColumns.map((c) => (
                    <label
                      key={c.key}
                      className="flex items-center gap-2.5 px-1.5 py-1 hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <div className="relative flex items-center flex-shrink-0">
                        <input
                          type="checkbox"
                          checked={visibleColumns.includes(c.key)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setVisibleColumns([...visibleColumns, c.key]);
                            } else {
                              setVisibleColumns(
                                visibleColumns.filter((k) => k !== c.key),
                              );
                            }
                          }}
                          className="peer h-3.5 w-3.5 appearance-none rounded border border-white/10 bg-white/5 checked:bg-cyan-500 checked:border-cyan-500 transition-all cursor-pointer"
                        />
                        <i className="fa-solid fa-check absolute opacity-0 peer-checked:opacity-100 text-[8px] text-black left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
                      </div>
                      <span className="text-[11px] text-white/45 font-medium">
                        {c.label}
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="h-px bg-white/5" />

              {/* Group By */}
              <div className="px-3 py-2.5 flex items-center justify-between gap-3">
                <span className="text-[9px] font-black uppercase tracking-widest text-white/20 flex-shrink-0">
                  Group by
                </span>
                <Dropdown
                  options={GROUP_OPTIONS.map((g) => ({
                    value: g.value,
                    label: g.label,
                  }))}
                  value={groupBy}
                  onChange={(v) => v && setGroupBy(v as GroupByKey)}
                  showPlaceholderOption={false}
                  allowClear={false}
                  className="flex-1"
                  buttonClassName="!py-1 !pl-2 !pr-1.5 !text-[11px] !font-bold !rounded-none !bg-white/5 !border-transparent"
                  iconClassName="!text-[8px]"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
