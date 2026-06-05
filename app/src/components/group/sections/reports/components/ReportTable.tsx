import { useState, useMemo, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { RowData, ColumnKey } from "@/components/group/sections/reports/types"
import { parseLocalDate, formatDuration } from "@/utils"
import { Tooltip, Dropdown } from "@/components/shared"

interface ReportTableProps {
  groupedRows: Record<string, RowData[]>
  visibleColumns: ColumnKey[]
  allColumns: readonly { key: ColumnKey; label: string; align?: string }[]
  search?: string
  statusFilter?: string
  onResetSearch?: () => void
  onResetFilter?: () => void
  onEditRow?: (row: RowData) => void
  pageSize: number
  onPageSizeChange: (size: number) => void
}

const COL_WIDTHS: Record<ColumnKey, string> = {
  name: "w-[240px] min-w-[200px]",
  date: "w-[140px] min-w-[140px]",
  status: "w-[100px] min-w-[100px]",
  check_in_time: "w-[120px] min-w-[120px]",
  check_out_time: "w-[120px] min-w-[120px]",
  total_hours: "w-[100px] min-w-[100px]",
  late_minutes: "w-[100px] min-w-[100px]",
  is_late: "w-[100px] min-w-[100px]",
  notes: "w-[300px] min-w-[250px]",
}

const STATUS_STYLE: Record<string, { color: string; label: string }> = {
  present: { color: "text-cyan-400", label: "Present" },
  late: { color: "text-orange-400", label: "Late" },
  absent: { color: "text-red-400", label: "Absent" },
  no_records: { color: "text-white/55", label: "N/A" },
}

const PAGE_SIZES = [25, 50, 100]

type FlatItem =
  | { kind: "group"; label: string; count: number }
  | { kind: "row"; data: RowData; key: string }

function alignClass(align?: string) {
  if (align === "center") return "text-center"
  if (align === "right") return "text-right"
  return "text-left"
}

function CellContent({ row, columnKey }: { row: RowData; columnKey: ColumnKey }): React.ReactNode {
  const val = row[columnKey]

  if (columnKey === "status") {
    const s = STATUS_STYLE[row.status] || STATUS_STYLE.no_records
    return (
      <div className={`inline-flex items-center text-[11px] font-semibold ${s.color}`}>
        {s.label}
      </div>
    )
  }

  if (columnKey === "is_late") {
    return row.is_late ?
        <span className="text-[11px] font-semibold text-orange-400/80">Late</span>
      : <span className="text-white/10">-</span>
  }

  if (columnKey === "check_in_time") {
    if (!row.check_in_time) return <span className="text-white/10">-</span>
    return (
      <div className="flex flex-col">
        <span className="font-medium text-white/90">
          {new Date(row.check_in_time).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
        {row.is_late && row.late_minutes > 0 && (
          <span className="mt-0.5 text-[10px] font-semibold text-orange-500/75">
            {formatDuration(row.late_minutes)} Late
          </span>
        )}
      </div>
    )
  }

  if (columnKey === "check_out_time") {
    return row.check_out_time ?
        <div className="flex flex-col">
          <span className="font-medium text-white/90">
            {new Date(row.check_out_time).toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      : <span className="text-white/10">-</span>
  }

  if (columnKey === "total_hours") {
    if (!row.total_hours) return <span className="text-white/10">-</span>
    const totalMins = Math.round(row.total_hours * 60)
    return (
      <span className="font-medium whitespace-nowrap text-cyan-400/80">
        {formatDuration(totalMins)}
      </span>
    )
  }

  if (columnKey === "late_minutes") {
    return row.late_minutes > 0 ?
        <span className="font-medium text-orange-400/80">{formatDuration(row.late_minutes)}</span>
      : <span className="text-white/10">-</span>
  }

  if (columnKey === "date") {
    return (
      <span className="font-medium text-white/65">
        {parseLocalDate(row.date).toLocaleDateString(undefined, {
          month: "short",
          day: "numeric",
          year: "numeric",
        })}
      </span>
    )
  }

  if (columnKey === "name") {
    return (
      <Tooltip content={val as string} position="top">
        <span className="block truncate font-semibold text-white">{val as string}</span>
      </Tooltip>
    )
  }

  if (columnKey === "notes") {
    if (!val) return <span className="text-white/10">-</span>
    const text = val as string
    const hasDivider = text.includes(" — ")
    if (hasDivider) {
      const [reason, note] = text.split(" — ")
      return (
        <div className="flex max-w-[280px] flex-col gap-0.5 leading-tight">
          <span className="text-[10px] font-bold tracking-wider text-cyan-400/80 uppercase">
            {reason}
          </span>
          <span className="text-[12px] font-medium break-words whitespace-normal text-white/55">
            {note}
          </span>
        </div>
      )
    }
    return (
      <span className="max-w-[280px] text-[12px] leading-relaxed font-medium break-words whitespace-normal text-white/60">
        {text}
      </span>
    )
  }

  return <>{val as string}</>
}

function EmptyTableState({
  search,
  statusFilter,
  onResetSearch,
  onResetFilter,
}: {
  search?: string
  statusFilter?: string
  onResetSearch?: () => void
  onResetFilter?: () => void
}) {
  return (
    <div className="flex flex-1 items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center justify-center px-6 text-center">
        <h3 className="mb-2 text-base font-bold text-white/80">
          {search ?
            `No matches for "${search}"`
          : statusFilter && statusFilter !== "all" ?
            `No results for "${statusFilter}"`
          : "No results found"}
        </h3>
        <p className="mb-8 max-w-70 text-xs leading-relaxed font-medium text-white/55">
          {search ?
            "No matching records found. Try a different search query."
          : statusFilter && statusFilter !== "all" ?
            `None of the records currently match the "${statusFilter}" filter.`
          : "There are no attendance records for this period."}
        </p>
        <div className="flex items-center gap-3">
          {statusFilter && statusFilter !== "all" && (
            <button
              onClick={onResetFilter}
              className="rounded-lg border border-white/6 bg-[rgba(22,28,36,0.64)] px-4 py-2 text-xs font-medium text-white/55 transition-all hover:bg-[rgba(28,35,44,0.82)] hover:text-white/80">
              Reset Filter
            </button>
          )}
          {search && (
            <button
              onClick={onResetSearch}
              className="rounded-lg border border-white/6 bg-[rgba(22,28,36,0.64)] px-4 py-2 text-xs font-medium text-white/55 transition-all hover:bg-[rgba(28,35,44,0.82)] hover:text-white/80">
              Reset Search
            </button>
          )}
          {!search && (!statusFilter || statusFilter === "all") && (
            <div className="flex flex-col items-center gap-2">
              <span className="mb-2 text-[11px] font-semibold text-white/55">Suggestions</span>
              <div className="flex gap-2">
                <span className="rounded-lg border border-white/6 bg-[rgba(22,28,36,0.64)] px-3 py-1.5 text-[11px] font-medium text-white/55">
                  Try Previous Week
                </span>
                <span className="rounded-lg border border-white/6 bg-[rgba(22,28,36,0.64)] px-3 py-1.5 text-[11px] font-medium text-white/55">
                  Expand Range
                </span>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}

function TablePagination({
  page,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: {
  page: number
  totalPages: number
  pageSize: number
  totalItems: number
  onPageChange: (page: number) => void
  onPageSizeChange: (size: number) => void
}) {
  return (
    <div className="flex shrink-0 items-center justify-between border-t border-white/6 bg-[rgba(16,21,28,0.98)] px-6 py-3">
      <div className="flex items-center gap-2 text-[11px] text-white/55">
        <span className="flex h-7 items-center">{totalItems} records</span>
        <Dropdown
          options={PAGE_SIZES.map((s) => ({ value: s, label: `${s} / page` }))}
          value={pageSize}
          onChange={(v) => v && onPageSizeChange(Number(v))}
          showPlaceholderOption={false}
          allowClear={false}
          menuWidth={100}
          align="center"
          buttonClassName="!h-7 !py-0 !text-[11px]"
        />
      </div>
      {totalPages > 1 && (
        <div className="flex items-center gap-1">
          <button
            onClick={() => onPageChange(0)}
            disabled={page === 0}
            className="flex h-7 items-center rounded px-2 text-[11px] font-medium text-white/55 transition-colors hover:text-white/80 disabled:opacity-30">
            First
          </button>
          <button
            onClick={() => onPageChange(page - 1)}
            disabled={page === 0}
            className="flex h-7 items-center rounded px-2 text-[11px] font-medium text-white/55 transition-colors hover:text-white/80 disabled:opacity-30">
            Prev
          </button>
          <motion.span
            key={`page-label-${page}`}
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            className="flex h-7 items-center px-3 text-[11px] font-medium text-white/55">
            Page {page + 1} of {totalPages}
          </motion.span>
          <button
            onClick={() => onPageChange(page + 1)}
            disabled={page >= totalPages - 1}
            className="flex h-7 items-center rounded px-2 text-[11px] font-medium text-white/55 transition-colors hover:text-white/80 disabled:opacity-30">
            Next
          </button>
          <button
            onClick={() => onPageChange(totalPages - 1)}
            disabled={page >= totalPages - 1}
            className="flex h-7 items-center rounded px-2 text-[11px] font-medium text-white/55 transition-colors hover:text-white/80 disabled:opacity-30">
            Last
          </button>
        </div>
      )}
    </div>
  )
}

export function ReportTable({
  groupedRows,
  visibleColumns,
  allColumns,
  search,
  statusFilter,
  onResetSearch,
  onResetFilter,
  onEditRow,
  pageSize,
  onPageSizeChange,
}: ReportTableProps) {
  const [page, setPage] = useState(0)

  const visibleColDefs = useMemo(
    () => allColumns.filter((c) => visibleColumns.includes(c.key)),
    [allColumns, visibleColumns],
  )

  useEffect(() => {
    setPage(0)
  }, [groupedRows])

  const items = useMemo(() => {
    const result: FlatItem[] = []
    for (const [groupInfo, rows] of Object.entries(groupedRows)) {
      if (rows.length === 0) continue
      if (groupInfo !== "__all__") {
        result.push({ kind: "group", label: groupInfo, count: rows.length })
      }
      for (const row of rows) {
        result.push({ kind: "row", data: row, key: `${row.person_id}_${row.date}` })
      }
    }
    return result
  }, [groupedRows])

  const totalPages = Math.max(1, Math.ceil(items.length / pageSize))
  const safePage = Math.min(page, totalPages - 1)
  const pageItems = useMemo(
    () => items.slice(safePage * pageSize, (safePage + 1) * pageSize),
    [items, safePage, pageSize],
  )

  const colCount = visibleColDefs.length + (onEditRow ? 1 : 0)

  if (items.length === 0) {
    return (
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="custom-scroll hover-scrollbar reports-scroll w-full max-w-full flex-1 overflow-auto">
          <EmptyTableState
            search={search}
            statusFilter={statusFilter}
            onResetSearch={onResetSearch}
            onResetFilter={onResetFilter}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={`page-${safePage}-${pageSize}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15, ease: "easeOut" }}
          className="flex flex-1 flex-col overflow-hidden">
          <div
            className="custom-scroll hover-scrollbar reports-scroll w-full max-w-full flex-1 overflow-x-auto overflow-y-auto px-10 pb-10"
            style={{
              maskImage:
                "linear-gradient(to bottom, black calc(100% - 50px), transparent calc(100% - 10px), black calc(100% - 10px), black 100%)",
              WebkitMaskImage:
                "linear-gradient(to bottom, black calc(100% - 50px), transparent calc(100% - 10px), black calc(100% - 10px), black 100%)",
            }}>
            <table className="w-full min-w-[900px] table-fixed border-separate border-spacing-0 text-left">
              <thead>
                <tr>
                  {visibleColDefs.map((c) => (
                    <th
                      key={c.key}
                      className={`sticky top-0 z-10 border-b border-white/6 bg-[rgba(16,21,28,0.98)] px-4 py-3 text-[11px] font-medium text-white/55 ${alignClass(c.align)} ${COL_WIDTHS[c.key] || ""}`}>
                      {c.label}
                    </th>
                  ))}
                  {onEditRow && (
                    <th className="sticky top-0 z-10 w-14 border-b border-white/6 bg-[rgba(16,21,28,0.98)]" />
                  )}
                </tr>
              </thead>
              <tbody>
                {pageItems.map((item) => {
                  if (item.kind === "group") {
                    return (
                      <tr key={item.label}>
                        <td
                          colSpan={colCount}
                          className="border-b border-white/6 bg-[rgba(22,28,36,0.58)] px-4 py-3">
                          <div className="flex items-center gap-3">
                            <span className="text-xs font-bold tracking-wide text-cyan-100/90">
                              {item.label}
                            </span>
                            <span className="inline-flex items-center rounded-lg border border-white/6 bg-[rgba(12,16,22,0.82)] px-1.5 py-0.5 text-[11px] font-medium text-white/55">
                              {item.count} {item.count === 1 ? "record" : "records"}
                            </span>
                          </div>
                        </td>
                      </tr>
                    )
                  }

                  const row = item.data

                  return (
                    <tr
                      key={item.key}
                      className="group cursor-default transition-all duration-200 hover:bg-cyan-500/3">
                      {visibleColDefs.map((c, cIdx) => (
                        <td
                          key={c.key}
                          className={`border-b border-white/5 px-4 py-3.5 ${c.key !== "notes" && c.key !== "name" ? "whitespace-nowrap" : ""} ${alignClass(c.align)} ${COL_WIDTHS[c.key] || ""} ${cIdx === 0 ? "relative" : ""}`}>
                          {cIdx === 0 && (
                            <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-cyan-500 opacity-0 transition-opacity group-hover:opacity-100" />
                          )}
                          <CellContent row={row} columnKey={c.key} />
                        </td>
                      ))}
                      {onEditRow && (
                        <td className="w-14 border-b border-white/5 px-3 py-3.5 text-right whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => onEditRow(row)}
                            className="p-1.5 text-white/20 opacity-0 transition-all group-hover:opacity-100 hover:text-white">
                            <i className="fa-solid fa-pen text-[12px]" />
                          </button>
                        </td>
                      )}
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
          <TablePagination
            page={safePage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalItems={items.length}
            onPageChange={setPage}
            onPageSizeChange={onPageSizeChange}
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
