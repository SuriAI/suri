import { useState, useEffect, useCallback, useMemo } from "react";
import { attendanceManager } from "@/services";
import { getLocalDateString, createDisplayNameMap } from "@/utils";
import { StatsCard, EmptyState } from "@/components/group/shared";
import type {
  AttendanceGroup,
  AttendanceMember,
  AttendanceStats,
  AttendanceRecord,
  AttendanceSession,
} from "@/types/recognition";

interface OverviewProps {
  group: AttendanceGroup;
  members: AttendanceMember[];
  onAddMember?: () => void;
}

const toDate = (value: Date | string): Date =>
  value instanceof Date ? value : new Date(value);

const formatTime = (value: Date | string): string => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
};

const formatDate = (value: Date | string): string => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  const month = date.toLocaleDateString("en-US", { month: "short" });
  const day = date.getDate();
  const year = date.getFullYear();
  return `${month} ${day}, ${year}`;
};

const getRelativeTime = (value: Date | string): string => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) return "Just now";
  const diffInSeconds = Math.floor(
    (new Date().getTime() - date.getTime()) / 1000,
  );
  if (diffInSeconds < 60) return "Just now";
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h ago`;
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays}d ago`;
  return formatDate(date);
};

export function Overview({ group, members, onAddMember }: OverviewProps) {
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [activeNow, setActiveNow] = useState<number>(0);
  const [activitySearch, setActivitySearch] = useState("");

  const displayNameMap = useMemo(() => {
    return createDisplayNameMap(members);
  }, [members]);

  const filteredRecords = useMemo(() => {
    let result = recentRecords;

    if (activitySearch.trim()) {
      const query = activitySearch.toLowerCase();
      result = result.filter((record) => {
        const name = (
          displayNameMap.get(record.person_id) || "Unknown"
        ).toLowerCase();
        return (
          name.includes(query) || record.person_id.toLowerCase().includes(query)
        );
      });
    }
    return result;
  }, [recentRecords, activitySearch, displayNameMap]);

  const loadOverviewData = useCallback(async () => {
    if (members.length === 0) {
      return;
    }

    try {
      const todayStr = getLocalDateString();
      const [groupStats, records, sessions] = await Promise.all([
        attendanceManager.getGroupStats(group.id, new Date()),
        attendanceManager.getRecords({
          group_id: group.id,
          limit: 100,
        }),
        attendanceManager.getSessions({
          group_id: group.id,
          start_date: todayStr,
          end_date: todayStr,
        }),
      ]);

      setStats(groupStats);
      setRecentRecords(records);
      const activeCount = (sessions as AttendanceSession[]).filter(
        (s) => s.status === "present",
      ).length;
      setActiveNow(activeCount);
    } catch (err) {
      console.error("Error loading overview data:", err);
    }
  }, [group.id, members.length]);

  useEffect(() => {
    loadOverviewData();
  }, [loadOverviewData]);

  if (members.length === 0) {
    return (
      <EmptyState
        title="No members in this group yet"
        action={
          onAddMember
            ? {
                label: "Add Member",
                onClick: onAddMember,
              }
            : undefined
        }
      />
    );
  }

  if (!stats) {
    return (
      <section className="flex items-center justify-center py-12">
        <div className="text-white/40 text-sm">Loading overview...</div>
      </section>
    );
  }

  return (
    <section className="space-y-4 h-full flex flex-col overflow-hidden p-6 custom-scroll overflow-y-auto">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 flex-shrink-0">
        <StatsCard type="active" value={activeNow} label="Active Now" />
        <StatsCard
          type="present"
          value={stats.present_today}
          total={stats.total_members}
          label="Timed-in Today"
        />
        <StatsCard
          type="absent"
          value={Math.max(
            0,
            (stats.total_members ?? 0) - (stats.present_today ?? 0),
          )}
          label="Not yet timed-in"
        />
        <StatsCard type="late" value={stats.late_today} label="Late arrivals" />
      </div>

      <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden flex-shrink-0 flex flex-col min-h-[400px]">
        <div className="p-4 border-b border-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0 bg-white/[0.02]">
          <h3 className="text-sm font-semibold text-white/90 flex items-center gap-2 whitespace-nowrap">
            <i className="fa-solid fa-clock-rotate-left text-cyan-500/70 text-xs"></i>
            Activity Log
          </h3>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto flex-shrink-0">
            <div className="relative w-full sm:w-56">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="search"
                value={activitySearch}
                onChange={(e) => setActivitySearch(e.target.value)}
                placeholder="Search records..."
                className="w-full rounded-lg border border-white/10 bg-black/40 pl-9 pr-3 py-1.5 text-xs text-white placeholder:text-white/30 focus:border-cyan-400/50 focus:bg-white/5 focus:outline-none transition-all"
              />
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scroll p-4">
          <div className="space-y-2 h-full">
            {recentRecords.length === 0 ? (
              <div className="flex flex-col flex-1 items-center justify-center p-12 h-full min-h-[250px]">
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center mb-4">
                  <i className="fa-regular fa-clock text-white/20 text-xl"></i>
                </div>
                <div className="text-sm font-medium text-white/60">
                  No activity yet
                </div>
                <div className="text-xs text-white/30 mt-1 text-center max-w-xs">
                  Check-ins and registrations will appear here.
                </div>
              </div>
            ) : filteredRecords.length === 0 ? (
              <div className="rounded-xl border border-white/5 bg-white/[0.02] px-6 py-8 text-center w-full mt-4">
                <div className="text-xs text-white/40">
                  No results found for "{activitySearch}"
                </div>
              </div>
            ) : (
              <div className="relative before:absolute before:inset-y-0 before:left-[11.7px] before:w-px before:bg-white/10 space-y-4 pt-2 pb-4 ml-2">
                {filteredRecords.slice(0, 50).map((record) => {
                  const displayName =
                    displayNameMap.get(record.person_id) || "Unknown";
                  const isHighConfidence = record.confidence >= 0.85;

                  return (
                    <div
                      key={record.id}
                      className="group relative flex items-start gap-4 hover:bg-white/[0.02] rounded-xl p-2 transition-colors -ml-4 pl-4"
                    >
                      <div className="relative z-10 w-6 h-6 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <div
                          className={`w-1.5 h-1.5 rounded-full ${
                            isHighConfidence
                              ? "bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                              : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.6)]"
                          }`}
                        />
                      </div>

                      <div className="flex-1 min-w-0 pt-0.5">
                        <div className="flex items-center justify-between gap-3 mb-1">
                          <div className="font-semibold text-white text-[14px] tracking-tight truncate">
                            {displayName}
                          </div>
                          <div className="text-[11px] font-medium text-white/40 flex-shrink-0">
                            {getRelativeTime(record.timestamp)}
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1.5 text-[12px] text-white/50">
                            <i className="fa-regular fa-clock text-[10px]"></i>
                            {formatTime(record.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
