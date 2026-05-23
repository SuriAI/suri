import { useState, useEffect, useCallback, useMemo, useRef } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useGroupStore } from "@/components/group/stores"
import { createDisplayNameMap, getLocalDateString } from "@/utils"
import { StatsCard, EmptyState } from "@/components/group/shared"
import type { AttendanceGroup, AttendanceMember } from "@/types/recognition"
import { Spinner } from "@/components/common"

interface OverviewProps {
  group: AttendanceGroup
  members: AttendanceMember[]
  onAddMember?: () => void
}

const toDate = (value: Date | string): Date => (value instanceof Date ? value : new Date(value))

const formatTime = (value: Date | string): string => {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
}

const formatDate = (value: Date | string): string => {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) {
    return "-"
  }
  const month = date.toLocaleDateString("en-US", { month: "short" })
  const day = date.getDate()
  const year = date.getFullYear()
  return `${month} ${day}, ${year}`
}

const getRelativeTime = (value: Date | string): string => {
  const date = toDate(value)
  if (Number.isNaN(date.getTime())) return "Just now"
  const diffInSeconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)
  if (diffInSeconds < 60) return "Just now"
  const diffInMinutes = Math.floor(diffInSeconds / 60)
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`
  const diffInHours = Math.floor(diffInMinutes / 60)
  if (diffInHours < 24) return `${diffInHours}h ago`
  const diffInDays = Math.floor(diffInHours / 24)
  if (diffInDays < 7) return `${diffInDays}d ago`
  return formatDate(date)
}

type DateFilter = "today" | "yesterday" | "week"

const DATE_FILTER_LABELS: Record<DateFilter, string> = {
  today: "Today",
  yesterday: "Yesterday",
  week: "This Week",
}

const getDateRange = (filter: DateFilter): { start: string; end: string } => {
  const now = new Date()
  const today = getLocalDateString(now)

  if (filter === "today") return { start: today, end: today }

  if (filter === "yesterday") {
    const yesterday = new Date(now)
    yesterday.setDate(yesterday.getDate() - 1)
    const y = getLocalDateString(yesterday)
    return { start: y, end: y }
  }

  // This week: Monday to today
  const monday = new Date(now)
  monday.setDate(now.getDate() - ((now.getDay() + 6) % 7))
  return { start: getLocalDateString(monday), end: today }
}

export function Overview({ group, members, onAddMember }: OverviewProps) {
  const fetchOverviewData = useGroupStore((state) => state.fetchOverviewData)
  const stats = useGroupStore((state) => state.overviewStats[group.id])

  const [activitySearch, setActivitySearch] = useState("")
  const [dateFilter, setDateFilter] = useState<DateFilter>("today")
  const [filterDropdownOpen, setFilterDropdownOpen] = useState(false)
  const [showSpinner, setShowSpinner] = useState(false)
  const filterDropdownRef = useRef<HTMLDivElement>(null)

  const { start, end } = useMemo(() => getDateRange(dateFilter), [dateFilter])
  const cacheKey = `${start}_${end}`

  const cachedRecords = useGroupStore((state) => state.overviewRecords[group.id]?.[cacheKey])
  const recentRecords = useMemo(() => cachedRecords || [], [cachedRecords])
  const recordsLoading = useGroupStore((state) => state.loading)

  useEffect(() => {
    if (stats) return

    const timer = setTimeout(() => {
      setShowSpinner(true)
    }, 200)

    return () => {
      clearTimeout(timer)
      setShowSpinner(false)
    }
  }, [stats])

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterDropdownRef.current && !filterDropdownRef.current.contains(e.target as Node)) {
        setFilterDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const displayNameMap = useMemo(() => {
    return createDisplayNameMap(members)
  }, [members])

  const filteredRecords = useMemo(() => {
    let result = recentRecords

    if (activitySearch.trim()) {
      const query = activitySearch.toLowerCase()
      result = result.filter((record) => {
        const name = (displayNameMap.get(record.person_id) || "Unknown").toLowerCase()
        return name.includes(query) || record.person_id.toLowerCase().includes(query)
      })
    }
    return result
  }, [recentRecords, activitySearch, displayNameMap])

  const loadOverviewData = useCallback(async () => {
    if (members.length === 0) return
    const { start, end } = getDateRange(dateFilter)
    await fetchOverviewData(group.id, start, end, false)
  }, [group.id, members.length, dateFilter, fetchOverviewData])

  useEffect(() => {
    const timer = setTimeout(() => {
      loadOverviewData()
    }, 0)
    return () => clearTimeout(timer)
  }, [loadOverviewData])

  if (members.length === 0) {
    return (
      <EmptyState
        title="No members in this group yet"
        action={
          onAddMember ?
            {
              label: "Add Member",
              onClick: onAddMember,
              iconClass: "fa-solid fa-user-plus text-[10px]",
            }
          : undefined
        }
      />
    )
  }

  if (!stats) {
    if (!showSpinner) {
      return <div className="h-full w-full bg-transparent" />
    }
    return (
      <div className="flex h-full w-full items-center justify-center py-32">
        <motion.div
          key="loading"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex flex-col items-center text-white/40">
          <Spinner size="lg" className="mb-4" />
          <div className="text-xs font-semibold tracking-wider text-white/55 uppercase">
            Loading Overview...
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <section className="flex h-full w-full flex-col px-10 pt-8">
      {/* Activity Overview */}
      <section className="shrink-0">
        <div className="grid grid-cols-1 gap-6 text-center sm:grid-cols-2">
          <div className="flex flex-col items-center">
            <StatsCard
              type="present"
              value={stats.present_today}
              total={stats.total_members}
              label="Present Today"
              tooltipText={
                <span>
                  Members who have checked in at least once today.{" "}
                  <span className="text-white/65">Resets at midnight.</span>
                </span>
              }
            />
            {(() => {
              const absent = Math.max(0, (stats.total_members ?? 0) - (stats.present_today ?? 0))
              return absent > 0 ?
                  <p className="mt-1.5 text-[11px] text-white/55">{absent} absent</p>
                : null
            })()}
          </div>
          <div className="flex flex-col items-center">
            <StatsCard
              type="late"
              value={stats.late_today}
              label="Late Arrivals"
              disabled={!(group.settings?.late_threshold_enabled ?? false)}
              disabledTooltipText={
                <span>
                  Late tracking is disabled. Click the{" "}
                  <span className="font-medium text-cyan-400">Attendance</span> tab in the sidebar
                  and enable <span className="font-medium text-cyan-400">Late Tracking</span> to set
                  a threshold.
                </span>
              }
            />
          </div>
        </div>
      </section>

      {/* Activity Log */}
      <section className="mt-8 flex min-h-0 flex-1 flex-col">
        <div className="mb-6 flex shrink-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-[14px] font-bold tracking-tight text-white">Activity Log</h2>
            <p className="mt-0.5 text-[12px] font-medium text-white/65">
              {DATE_FILTER_LABELS[dateFilter]}&apos;s records
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {/* Search */}
            <div className="group/search relative h-9">
              <div className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-white/25 transition-colors group-focus-within/search:text-white/45">
                <i className="fa-solid fa-magnifying-glass text-[11px]"></i>
              </div>
              <input
                type="text"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Search..."
                className="h-full w-36 rounded-lg border border-white/5 bg-white/5 pr-7 pl-8.5 text-xs font-medium text-white placeholder-white/30 transition-all outline-none focus:w-48 focus:border-white/20 focus:bg-white/[0.08]"
              />
              {activitySearch && (
                <button
                  onClick={() => setActivitySearch("")}
                  className="absolute top-1/2 right-2 flex h-4 w-4 -translate-y-1/2 items-center justify-center rounded-sm text-white/55 hover:text-white">
                  <i className="fa-solid fa-xmark text-[9px]"></i>
                </button>
              )}
            </div>

            {/* Date filter dropdown */}
            <div className="relative" ref={filterDropdownRef}>
              <button
                onClick={() => setFilterDropdownOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-md border border-white/5 bg-white/5 px-2.5 py-1.5 text-[12px] font-semibold text-white/80 transition-all duration-200 hover:border-white/10 hover:bg-white/[0.08] focus:border-white/20 focus:bg-white/[0.08] active:scale-95">
                <i className="fa-regular fa-calendar text-[10px]" />
                {DATE_FILTER_LABELS[dateFilter]}
                <i
                  className={`fa-solid fa-chevron-down text-[9px] text-white/55 transition-transform duration-150 ${filterDropdownOpen ? "rotate-180" : ""}`}
                />
              </button>

              <AnimatePresence>
                {filterDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -5 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -5 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute top-full right-0 z-50 mt-1.5 min-w-[128px] overflow-hidden rounded-lg border border-white/5 bg-[#0f1319]/95 p-1 shadow-xl">
                    {(["today", "yesterday", "week"] as DateFilter[]).map((filter) => (
                      <button
                        key={filter}
                        onClick={() => {
                          setDateFilter(filter)
                          setActivitySearch("")
                          setFilterDropdownOpen(false)
                        }}
                        className={`flex w-full items-center rounded px-3 py-1.5 text-left text-[12px] transition-all duration-150 ${
                          dateFilter === filter ?
                            "bg-cyan-500/10 font-semibold text-cyan-400"
                          : "text-white/65 hover:bg-white/5 hover:text-white"
                        }`}>
                        {DATE_FILTER_LABELS[filter]}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <div
          className="custom-scroll relative flex-1 overflow-y-auto pr-2 pb-10 text-left"
          style={{
            maskImage: "linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)",
            WebkitMaskImage:
              "linear-gradient(to bottom, black calc(100% - 40px), transparent 100%)",
          }}>
          <AnimatePresence mode="wait">
            {recordsLoading ?
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.15 }}
                className="flex items-center justify-center py-12 text-white/20">
                <Spinner size="sm" color="muted" />
              </motion.div>
            : <motion.div
                key={dateFilter}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="flex h-full min-h-[200px] flex-col">
                {recentRecords.length === 0 ?
                  <div className="flex flex-1 flex-col items-center justify-center text-white/55">
                    <i className="fa-solid fa-clock mb-3 text-2xl opacity-50" />
                    <div className="text-[12px] font-medium">
                      No records{" "}
                      {dateFilter === "today" ?
                        "today"
                      : dateFilter === "yesterday" ?
                        "yesterday"
                      : "this week"}
                    </div>
                  </div>
                : filteredRecords.length === 0 ?
                  <div className="flex flex-1 flex-col items-center justify-center text-white/55">
                    <i className="fa-solid fa-ghost mb-3 text-2xl" />
                    <div className="text-[12px] font-medium">No results found</div>
                    <div className="mt-1 text-[11px]">
                      No activity matched &quot;{activitySearch}&quot;
                    </div>
                  </div>
                : <div className="space-y-1">
                    {filteredRecords.slice(0, 50).map((record) => {
                      const displayName = displayNameMap.get(record.person_id) || "Unknown"

                      return (
                        <div
                          key={record.id}
                          className="group/item flex items-center justify-between rounded-lg border border-transparent bg-transparent px-4 py-3 transition-colors hover:bg-white/[0.02]">
                          <div className="flex items-center gap-4">
                            <div className="flex flex-col">
                              <span className="text-[13px] font-medium text-white transition-colors">
                                {displayName}
                              </span>
                              <div className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-white/65">
                                <i className="fa-regular fa-clock text-[10px] opacity-70"></i>
                                <span>{formatTime(record.timestamp)}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-4">
                            <span className="text-[12px] font-medium text-white/55">
                              {getRelativeTime(record.timestamp)}
                            </span>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                }
              </motion.div>
            }
          </AnimatePresence>
        </div>
      </section>
    </section>
  )
}
