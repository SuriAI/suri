import { Fragment, useState, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import type { RowData, ColumnKey } from "@/components/group/sections/reports/types"
import { parseLocalDate, formatDuration } from "@/utils"

interface ReportTableProps {
  groupedRows: Record<string, RowData[]>
  visibleColumns: ColumnKey[]
  allColumns: readonly { key: ColumnKey; label: string; align?: string }[]
  search?: string
  statusFilter?: string
  onResetSearch?: () => void
  onResetFilter?: () => void
  onEditRow?: (row: RowData) => void
}

export function ReportTable({
  groupedRows,
  visibleColumns,
  allColumns,
  search,
  statusFilter,
  onResetFilter,
  onEditRow,
}: ReportTableProps) {
  const visibleColDefs = allColumns.filter((c) => visibleColumns.includes(c.key))

  const [displayLimit, setDisplayLimit] = useState(100)
  const [prevGroupedRows, setPrevGroupedRows] = useState(groupedRows)

  if (groupedRows !== prevGroupedRows) {
    setPrevGroupedRows(groupedRows)
    setDisplayLimit(100)
  }

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget
      if (scrollHeight - scrollTop - clientHeight < 300) {
        const totalRows = Object.values(groupedRows).reduce((acc, r) => acc + r.length, 0)
        if (displayLimit < totalRows) {
          setDisplayLimit((prev) => Math.min(prev + 100, totalRows))
        }
      }
    },
    [groupedRows, displayLimit],
  )

  const getColWidthClass = (key: ColumnKey) => {
    switch (key) {
      case "name":
        return "w-[20%] min-w-[150px]"
      case "date":
        return "w-[140px] min-w-[140px]"
      case "status":
        return "w-[100px] min-w-[100px]"
      case "check_in_time":
        return "w-[120px] min-w-[120px]"
      case "check_out_time":
        return "w-[120px] min-w-[120px]"
      case "total_hours":
        return "w-[100px] min-w-[100px]"
      case "notes":
        return "min-w-[250px]"
      default:
        return ""
    }
  }

  // Standardized responsive horizontal scroll container
  return (
    <div
      onScroll={handleScroll}
      className="custom-scroll hover-scrollbar reports-scroll w-full max-w-full flex-1 overflow-x-auto overflow-y-auto px-10 pb-10"
      style={{
        maskImage:
          "linear-gradient(to bottom, black calc(100% - 50px), transparent calc(100% - 10px), black calc(100% - 10px), black 100%)",
        WebkitMaskImage:
          "linear-gradient(to bottom, black calc(100% - 50px), transparent calc(100% - 10px), black calc(100% - 10px), black 100%)",
      }}>
      <table className="w-full min-w-[900px] border-separate border-spacing-0 text-left">
        <thead>
          <tr>
            {visibleColDefs.map((c) => {
              let alignClass = "text-left"
              if (c.align === "center") alignClass = "text-center"
              else if (c.align === "right") alignClass = "text-right"
              const widthClass = getColWidthClass(c.key)
              return (
                <th
                  key={c.key}
                  className={`sticky top-0 z-10 border-b border-white/6 bg-[rgba(16,21,28,0.98)] px-4 py-3 text-[11px] font-medium text-white/55 ${alignClass} ${widthClass}`}>
                  {c.label}
                </th>
              )
            })}
            {onEditRow && (
              <th className="sticky top-0 z-10 w-10 border-b border-white/6 bg-[rgba(16,21,28,0.98)]" />
            )}
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5 text-sm">
          <AnimatePresence mode="wait">
            {(
              Object.keys(groupedRows).length === 0 ||
              Object.values(groupedRows).every((rows) => rows.length === 0)
            ) ?
              <motion.tr
                key="empty"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
                <td colSpan={visibleColDefs.length + (onEditRow ? 1 : 0)} className="py-24">
                  <div className="flex flex-col items-center justify-center px-6 text-center">
                    <h3 className="mb-2 text-base font-bold text-white/80">
                      {search ?
                        `No matches for "${search}"`
                      : statusFilter !== "all" ?
                        `No results for "${statusFilter}"`
                      : "No results found"}
                    </h3>

                    <p className="mb-8 max-w-70 text-xs leading-relaxed font-medium text-white/55">
                      {search ?
                        "No matching records found. Try a different search query."
                      : statusFilter !== "all" ?
                        `None of the records currently match the "${statusFilter}" filter.`
                      : "There are no attendance records for this period."}
                    </p>

                    <div className="flex items-center gap-3">
                      {statusFilter !== "all" && (
                        <button
                          onClick={onResetFilter}
                          className="rounded-lg border border-white/6 bg-[rgba(22,28,36,0.64)] px-4 py-2 text-xs font-medium text-white/55 transition-all hover:bg-[rgba(28,35,44,0.82)] hover:text-white/80">
                          Reset Filter
                        </button>
                      )}
                      {!search && statusFilter === "all" && (
                        <div className="flex flex-col items-center gap-2">
                          <span className="mb-2 text-[11px] font-semibold text-white/55">
                            Suggestions
                          </span>
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
                  </div>
                </td>
              </motion.tr>
            : <motion.tr
                key="results"
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}>
                <td colSpan={visibleColDefs.length + (onEditRow ? 1 : 0)} className="p-0">
                  <table className="w-full">
                    <tbody>
                      {(() => {
                        let renderedCount = 0
                        return Object.entries(groupedRows).map(([groupInfo, rows]) => {
                          if (rows.length === 0) return null
                          if (renderedCount >= displayLimit) return null

                          const rowsToRender = rows.slice(0, displayLimit - renderedCount)
                          renderedCount += rowsToRender.length

                          if (rowsToRender.length === 0) return null

                          return (
                            <Fragment key={groupInfo}>
                              {groupInfo !== "__all__" && (
                                <tr>
                                  <td
                                    colSpan={visibleColDefs.length + (onEditRow ? 1 : 0)}
                                    className="border-b border-white/6 bg-[rgba(22,28,36,0.58)] px-4 py-3">
                                    <div className="flex items-center gap-3">
                                      <span className="text-xs font-bold tracking-wide text-cyan-100/90">
                                        {groupInfo}
                                      </span>
                                      <span className="inline-flex items-center rounded-lg border border-white/6 bg-[rgba(12,16,22,0.82)] px-1.5 py-0.5 text-[11px] font-medium text-white/55">
                                        {rows.length} {rows.length === 1 ? "record" : "records"}
                                      </span>
                                    </div>
                                  </td>
                                </tr>
                              )}
                              {rowsToRender.map((row, rIdx) => (
                                <tr
                                  key={rIdx}
                                  className="group cursor-default transition-all duration-200 hover:bg-cyan-500/3">
                                  {visibleColDefs.map((c, cIdx) => {
                                    const val = row[c.key]
                                    let content: React.ReactNode = val as string

                                    if (c.key === "status") {
                                      const s = row.status
                                      let textColor = "text-white/55"
                                      if (s === "present") textColor = "text-cyan-400"
                                      if (s === "late") textColor = "text-orange-400"
                                      if (s === "absent") textColor = "text-red-400"
                                      if (s === "no_records") textColor = "text-white/55"

                                      content = (
                                        <div
                                          className={`inline-flex items-center text-[11px] font-semibold ${textColor}`}>
                                          {s === "no_records" ? "N/A" : s}
                                        </div>
                                      )
                                    } else if (c.key === "is_late") {
                                      content =
                                        row.is_late ?
                                          <span className="text-[11px] font-semibold text-orange-400/80">
                                            Late
                                          </span>
                                        : <span className="text-white/10">-</span>
                                    } else if (c.key === "check_in_time") {
                                      if (row.check_in_time) {
                                        content = (
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
                                      } else {
                                        content = <span className="text-white/10">-</span>
                                      }
                                    } else if (c.key === "check_out_time") {
                                      if (row.check_out_time) {
                                        content = (
                                          <div className="flex flex-col">
                                            <span className="font-medium text-white/90">
                                              {new Date(row.check_out_time).toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                              })}
                                            </span>
                                          </div>
                                        )
                                      } else {
                                        content = <span className="text-white/10">-</span>
                                      }
                                    } else if (c.key === "total_hours") {
                                      if (row.total_hours) {
                                        const totalMins = Math.round(row.total_hours * 60)
                                        content = (
                                          <span className="font-medium whitespace-nowrap text-cyan-400/80">
                                            {formatDuration(totalMins)}
                                          </span>
                                        )
                                      } else {
                                        content = <span className="text-white/10">-</span>
                                      }
                                    } else if (c.key === "late_minutes") {
                                      content =
                                        row.late_minutes > 0 ?
                                          <span className="font-medium text-orange-400/80">
                                            {formatDuration(row.late_minutes)}
                                          </span>
                                        : <span className="text-white/10">-</span>
                                    } else if (c.key === "date") {
                                      content = (
                                        <span className="font-medium text-white/65">
                                          {parseLocalDate(row.date).toLocaleDateString(undefined, {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                          })}
                                        </span>
                                      )
                                    } else if (c.key === "name") {
                                      content = (
                                        <span className="font-semibold text-white">
                                          {val as string}
                                        </span>
                                      )
                                    } else if (c.key === "notes") {
                                      if (val) {
                                        const text = val as string
                                        const hasDivider = text.includes(" — ")
                                        if (hasDivider) {
                                          const [reason, note] = text.split(" — ")
                                          content = (
                                            <div className="flex max-w-[280px] flex-col gap-0.5 leading-tight">
                                              <span className="text-[10px] font-bold tracking-wider text-cyan-400/80 uppercase">
                                                {reason}
                                              </span>
                                              <span className="text-[12px] font-medium break-words whitespace-normal text-white/55">
                                                {note}
                                              </span>
                                            </div>
                                          )
                                        } else {
                                          content = (
                                            <span className="max-w-[280px] text-[12px] leading-relaxed font-medium break-words whitespace-normal text-white/60">
                                              {text}
                                            </span>
                                          )
                                        }
                                      } else {
                                        content = <span className="text-white/10">-</span>
                                      }
                                    }

                                    // Cell alignment
                                    let alignClass = "text-left"
                                    if (c.align === "center") alignClass = "text-center"
                                    else if (c.align === "right") alignClass = "text-right"

                                    // Notes column should NOT be whitespace-nowrap
                                    const isNotesCol = c.key === "notes"
                                    const widthClass = getColWidthClass(c.key)

                                    return (
                                      <td
                                        key={c.key}
                                        className={`border-b border-white/5 px-4 py-3.5 ${isNotesCol ? "max-w-[300px]" : "whitespace-nowrap"} ${alignClass} ${widthClass} ${cIdx === 0 ? "relative" : ""}`}>
                                        {cIdx === 0 && (
                                          <div className="absolute top-0 bottom-0 left-0 w-0.5 bg-cyan-500 opacity-0 transition-opacity group-hover:opacity-100" />
                                        )}
                                        {content}
                                      </td>
                                    )
                                  })}
                                  {onEditRow && (
                                    <td className="border-b border-white/5 px-3 py-3.5 text-right whitespace-nowrap">
                                      <button
                                        type="button"
                                        onClick={() => onEditRow(row)}
                                        className="p-1.5 text-white/20 opacity-0 transition-all group-hover:opacity-100 hover:text-white">
                                        <i className="fa-solid fa-pen text-[12px]" />
                                      </button>
                                    </td>
                                  )}
                                </tr>
                              ))}
                            </Fragment>
                          )
                        })
                      })()}
                    </tbody>
                  </table>
                </td>
              </motion.tr>
            }
          </AnimatePresence>
        </tbody>
      </table>
    </div>
  )
}
