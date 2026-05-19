import { Fragment } from "react"
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

  // Standardized responsive horizontal scroll container
  return (
    <div
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
              return (
                <th
                  key={c.key}
                  className={`sticky top-0 z-10 border-b border-white/6 bg-[rgba(16,21,28,0.98)] px-4 py-3 text-[11px] font-medium text-white/55 ${alignClass}`}>
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
          {(
            Object.keys(groupedRows).length === 0 ||
            Object.values(groupedRows).every((rows) => rows.length === 0)
          ) ?
            <tr>
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
                      "We couldn't find anything matching your search. Try a different keyword."
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
            </tr>
          : Object.entries(groupedRows).map(([groupInfo, rows]) => {
              if (rows.length === 0) return null
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
                  {rows.map((row, rIdx) => (
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
                          if (s === "late") textColor = "text-amber-400"
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
                              <span className="text-[11px] font-semibold text-amber-400/80">
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
                                  <span className="mt-0.5 text-[10px] font-semibold text-amber-500/75">
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
                              <span className="font-medium text-amber-400/80">
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
                            <span className="font-semibold text-white">{val as string}</span>
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

                        return (
                          <td
                            key={c.key}
                            className={`border-b border-white/5 px-4 py-3.5 ${isNotesCol ? "max-w-[300px]" : "whitespace-nowrap"} ${alignClass} ${cIdx === 0 ? "relative" : ""}`}>
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
          }
        </tbody>
      </table>
    </div>
  )
}
