import { useState, useEffect, useCallback, useRef } from 'react';
import { attendanceManager } from '../services/AttendanceManager';
import { FaceRegistrationLab } from './FaceRegistrationLab';
import { BulkFaceRegistration } from './BulkFaceRegistration';
import { AssistedCameraRegistration } from './AssistedCameraRegistration';
import type {
  AttendanceGroup,
  AttendanceMember,
  AttendanceStats,
  AttendanceReport,
  AttendanceRecord,
  AttendanceSession,
  GroupType
} from '../types/recognition.js';

export type MenuSection = 'overview' | 'members' | 'reports' | 'registration' | 'settings';

interface MenuProps {
  onBack: () => void;
  initialSection?: MenuSection;
}

interface SectionConfig {
  id: MenuSection;
  label: string;
}

const SECTION_CONFIG: SectionConfig[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'members', label: 'Members' },
  { id: 'reports', label: 'Reports' },
  { id: 'registration', label: 'Face registration' },
  { id: 'settings', label: 'Group Settings' }
];

const getGroupTypeIcon = (type: GroupType): string => {
  switch (type) {
    case 'employee':
      return '👔';
    case 'student':
      return '🎓';
    case 'visitor':
      return '👤';
    case 'general':
    default:
      return '👥';
  }
};

const toDate = (value: Date | string): Date => (value instanceof Date ? value : new Date(value));

const formatTime = (value: Date | string): string => {
  const date = toDate(value);
  if (Number.isNaN(date.getTime())) {
    return '—';
  }

  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export function Menu({ onBack, initialSection }: MenuProps) {
  const [selectedGroup, setSelectedGroup] = useState<AttendanceGroup | null>(null);
  const [groups, setGroups] = useState<AttendanceGroup[]>([]);
  const [members, setMembers] = useState<AttendanceMember[]>([]);
  const [stats, setStats] = useState<AttendanceStats | null>(null);
  const [report, setReport] = useState<AttendanceReport | null>(null);
  const [recentRecords, setRecentRecords] = useState<AttendanceRecord[]>([]);
  const [todaySessions, setTodaySessions] = useState<AttendanceSession[]>([]);
  const [reportStartDate, setReportStartDate] = useState<string>(
    new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  );
  const [reportEndDate, setReportEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [activeSection, setActiveSection] = useState<MenuSection>(initialSection ?? 'overview');
  const [error, setError] = useState<string | null>(null);
  const [pendingTasks, setPendingTasks] = useState(0);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [editingMember, setEditingMember] = useState<AttendanceMember | null>(null);
  const [bulkMembersText, setBulkMembersText] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);
  const [isProcessingBulk, setIsProcessingBulk] = useState(false);
  const [bulkResults, setBulkResults] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberRole, setNewMemberRole] = useState('');
  const [showBulkRegistration, setShowBulkRegistration] = useState(false);
  const [showCameraQueue, setShowCameraQueue] = useState(false);
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupType, setNewGroupType] = useState<GroupType>('general');
  const [newGroupDescription, setNewGroupDescription] = useState('');

  const loading = pendingTasks > 0;
  const selectedGroupRef = useRef<AttendanceGroup | null>(null);
  const fetchGroupDetailsRef = useRef<((groupId: string) => Promise<void>) | null>(null);

  const trackAsync = useCallback(async <T,>(action: () => Promise<T>): Promise<T> => {
    setPendingTasks(prev => prev + 1);
    try {
      return await action();
    } finally {
      setPendingTasks(prev => (prev > 0 ? prev - 1 : 0));
    }
  }, []);

  const fetchGroupDetails = useCallback(async (groupId: string) => {
    await trackAsync(async () => {
      try {
        setError(null);
        const todayStr = new Date().toISOString().split('T')[0];
        const [groupMembers, groupStats, sessions, records] = await Promise.all([
          attendanceManager.getGroupMembers(groupId),
          attendanceManager.getGroupStats(groupId, new Date()),
          attendanceManager.getSessions({
            group_id: groupId,
            start_date: todayStr,
            end_date: todayStr
          }),
          attendanceManager.getRecords({
            group_id: groupId,
            limit: 100
          })
        ]);

        setMembers(groupMembers);
        setStats(groupStats);
        setTodaySessions(sessions);
        setRecentRecords(records);
      } catch (err) {
        console.error('Error loading group data:', err);
        setError(err instanceof Error ? err.message : 'Failed to load group data');
      }
    });
  }, [trackAsync]);

  fetchGroupDetailsRef.current = fetchGroupDetails;

  const fetchGroups = useCallback(async (): Promise<AttendanceGroup | null> => {
    return trackAsync(async () => {
      try {
        setError(null);
        const allGroups = await attendanceManager.getGroups();
        setGroups(allGroups);

        if (allGroups.length === 0) {
          setSelectedGroup(null);
          setMembers([]);
          setStats(null);
          setTodaySessions([]);
          setRecentRecords([]);
          setReport(null);
          return null;
        }

        const existingSelection = selectedGroupRef.current;
        const resolved = existingSelection
          ? allGroups.find(group => group.id === existingSelection.id) ?? allGroups[0]
          : allGroups[0];

        setSelectedGroup(resolved);
        return resolved;
      } catch (err) {
        console.error('Error loading groups:', err);
        setError(err instanceof Error ? err.message : 'Failed to load groups');
        return null;
      }
    });
  }, [trackAsync]);

  const generateReport = useCallback(async () => {
    if (!selectedGroup) {
      setReport(null);
      return;
    }

    const startDate = new Date(reportStartDate);
    const endDate = new Date(reportEndDate);

    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      setError('Please select valid report dates.');
      return;
    }

    if (startDate > endDate) {
      setError('The start date must be before the end date.');
      return;
    }

    await trackAsync(async () => {
      try {
        setError(null);
        const generatedReport = await attendanceManager.generateReport(selectedGroup.id, startDate, endDate);
        setReport(generatedReport);
      } catch (err) {
        console.error('Error generating report:', err);
        setError(err instanceof Error ? err.message : 'Failed to generate report');
      }
    });
  }, [reportEndDate, reportStartDate, selectedGroup, trackAsync]);

  const exportData = useCallback(async () => {
    await trackAsync(async () => {
      try {
        setError(null);
        const data = await attendanceManager.exportData();
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `attendance-data-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Error exporting data:', err);
        setError(err instanceof Error ? err.message : 'Failed to export data');
      }
    });
  }, [trackAsync]);

  const exportReport = useCallback(() => {
    if (!report || !selectedGroup) {
      return;
    }

    try {
      const csvContent = [
        ['Name', 'Total Days', 'Present Days', 'Absent Days', 'Late Days', 'Total Hours', 'Average Hours', 'Attendance Rate'],
        ...report.members.map(member => [
          member.name,
          member.total_days.toString(),
          member.present_days.toString(),
          member.absent_days.toString(),
          member.late_days.toString(),
          member.total_hours.toString(),
          member.average_hours.toString(),
          `${member.attendance_rate}%`
        ])
      ]
        .map(row => row.map(cell => `"${cell}"`).join(','))
        .join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `attendance-report-${selectedGroup.name}-${reportStartDate}-to-${reportEndDate}.csv`;
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error exporting report:', err);
      setError(err instanceof Error ? err.message : 'Failed to export report');
    }
  }, [report, selectedGroup, reportStartDate, reportEndDate]);

  const resetMemberForm = () => {
    setNewMemberName('');
    setNewMemberRole('');
    setBulkMembersText('');
    setBulkResults(null);
    setIsBulkMode(false);
  };

  const resetGroupForm = () => {
    setNewGroupName('');
    setNewGroupType('general');
    setNewGroupDescription('');
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      return;
    }

    await trackAsync(async () => {
      try {
        const newGroup = await attendanceManager.createGroup(
          newGroupName.trim(), 
          newGroupType, 
          newGroupDescription.trim() || undefined
        );
        resetGroupForm();
        setShowCreateGroupModal(false);
        await fetchGroups();
        setSelectedGroup(newGroup);
      } catch (err) {
        console.error('Error creating group:', err);
        setError(err instanceof Error ? err.message : 'Failed to create group');
      }
    });
  };

  const handleEditGroup = async () => {
    if (!selectedGroup || !newGroupName.trim()) {
      return;
    }

    await trackAsync(async () => {
      try {
        await attendanceManager.updateGroup(selectedGroup.id, {
          name: newGroupName.trim(),
          type: newGroupType,
          description: newGroupDescription.trim() || undefined
        });
        resetGroupForm();
        setShowEditGroupModal(false);
        await fetchGroups();
      } catch (err) {
        console.error('Error updating group:', err);
        setError(err instanceof Error ? err.message : 'Failed to update group');
      }
    });
  };

  const handleDeleteGroup = async () => {
    if (!selectedGroup) {
      return;
    }

    if (!confirm(`Delete group "${selectedGroup.name}"? This will remove all members and attendance records.`)) {
      return;
    }

    await trackAsync(async () => {
      try {
        await attendanceManager.deleteGroup(selectedGroup.id);
        setSelectedGroup(null);
        await fetchGroups();
      } catch (err) {
        console.error('Error deleting group:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete group');
      }
    });
  };

  const openEditGroup = () => {
    if (!selectedGroup) return;
    setNewGroupName(selectedGroup.name);
    setNewGroupType(selectedGroup.type);
    setNewGroupDescription(selectedGroup.description || '');
    setShowEditGroupModal(true);
  };

  const handleAddMember = async () => {
    if (!selectedGroup || !newMemberName.trim()) {
      return;
    }

    await trackAsync(async () => {
      try {
        await attendanceManager.addMember(selectedGroup.id, newMemberName.trim(), {
          role: newMemberRole.trim() || undefined
        });
        resetMemberForm();
        setShowAddMemberModal(false);
        await fetchGroupDetails(selectedGroup.id);
      } catch (err) {
        console.error('Error adding member:', err);
        setError(err instanceof Error ? err.message : 'Failed to add member');
      }
    });
  };

  const handleBulkAddMembers = async () => {
    if (!selectedGroup || !bulkMembersText.trim()) {
      return;
    }

    setIsProcessingBulk(true);
    setBulkResults(null);

    await trackAsync(async () => {
      try {
        const lines = bulkMembersText.split('\n').filter(line => line.trim());
        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const line of lines) {
          const parts = line.split(',').map(p => p.trim());
          const name = parts[0];
          const role = parts[1] || '';

          if (!name) {
            failed++;
            errors.push(`Empty name in line: "${line}"`);
            continue;
          }

          try {
            await attendanceManager.addMember(selectedGroup.id, name, {
              role: role || undefined
            });
            success++;
          } catch (err) {
            failed++;
            errors.push(`Failed to add "${name}": ${err instanceof Error ? err.message : 'Unknown error'}`);
          }
        }

        setBulkResults({ success, failed, errors });
        await fetchGroupDetails(selectedGroup.id);

        if (failed === 0) {
          setTimeout(() => {
            resetMemberForm();
            setShowAddMemberModal(false);
          }, 2000);
        }
      } catch (err) {
        console.error('Error bulk adding members:', err);
        setError(err instanceof Error ? err.message : 'Failed to bulk add members');
      } finally {
        setIsProcessingBulk(false);
      }
    });
  };

  const handleFileUpload = async (file: File) => {
    try {
      const text = await file.text();
      setBulkMembersText(text);
    } catch {
      setError('Failed to read file. Please ensure it\'s a valid text or CSV file.');
    }
  };

  const handleEditMember = async () => {
    if (!editingMember || !newMemberName.trim()) {
      return;
    }

    await trackAsync(async () => {
      try {
        const updates: Partial<AttendanceMember> = {
          name: newMemberName.trim(),
          role: newMemberRole.trim() || undefined
        };

        await attendanceManager.updateMember(editingMember.person_id, updates);
        resetMemberForm();
        setEditingMember(null);
        setShowEditMemberModal(false);
        const targetGroupId = editingMember.group_id ?? selectedGroup?.id;
        if (targetGroupId) {
          await fetchGroupDetails(targetGroupId);
        }
      } catch (err) {
        console.error('Error updating member:', err);
        setError(err instanceof Error ? err.message : 'Failed to update member');
      }
    });
  };

  const handleRemoveMember = async (personId: string) => {
    if (!selectedGroup) {
      return;
    }

    if (!confirm('Remove this member from the group?')) {
      return;
    }

    await trackAsync(async () => {
      try {
        await attendanceManager.removeMember(personId);
        await fetchGroupDetails(selectedGroup.id);
      } catch (err) {
        console.error('Error removing member:', err);
        setError(err instanceof Error ? err.message : 'Failed to remove member');
      }
    });
  };

  const openEditMember = (member: AttendanceMember) => {
    setEditingMember(member);
    setNewMemberName(member.name);
    setNewMemberRole(member.role || '');
    setShowEditMemberModal(true);
  };

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  useEffect(() => {
    const initialise = async () => {
      const group = await fetchGroups();
      if (group && fetchGroupDetailsRef.current) {
        await fetchGroupDetailsRef.current(group.id);
      }
    };

    void initialise();
  }, [fetchGroups]);

  useEffect(() => {
    if (selectedGroup) {
      void fetchGroupDetails(selectedGroup.id);
    }
  }, [selectedGroup, fetchGroupDetails]);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

  useEffect(() => {
    if (selectedGroup) {
      void generateReport();
    }
  }, [selectedGroup, reportStartDate, reportEndDate, generateReport]);

  const selectedGroupCreatedAt = selectedGroup ? toDate(selectedGroup.created_at) : null;

  return (
    <div className="pt-10 h-screen bg-black text-white flex flex-col">
      <header className="px-6 py-4 border-b border-white/10 bg-black/80 backdrop-blur">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-semibold">Menu</h1>
            <div className="h-6 w-px bg-white/10" />
            <select
              value={selectedGroup?.id ?? ''}
              onChange={event => {
                const group = groups.find(item => item.id === event.target.value) ?? null;
                setSelectedGroup(group);
              }}
              className="bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500/60"
            >
              <option value="">Select group…</option>
              {groups.map(group => (
                <option key={group.id} value={group.id} className="bg-black text-white">
                  {getGroupTypeIcon(group.type)} {group.name}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-2">
            {loading && (
              <div className="flex items-center gap-2 text-blue-300 text-xs">
                <span className="h-3 w-3 border-2 border-blue-400/40 border-t-blue-300 rounded-full animate-spin" />
              </div>
            )}
            <button
              onClick={() => setShowCreateGroupModal(true)}
              className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/30 transition-colors text-xs flex items-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" strokeWidth={2.5}/></svg>
              New Group
            </button>
            <button
              onClick={exportData}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-200 hover:bg-blue-600/30 transition-colors text-xs disabled:opacity-50"
            >
              Export
            </button>
            <button
              onClick={onBack}
              className="px-3 py-1.5 rounded-lg bg-white text-black hover:bg-gray-100 transition-colors text-xs font-medium"
            >
              Close
            </button>
          </div>
        </div>
        <nav className="mt-3 flex flex-wrap gap-1.5">
          {SECTION_CONFIG.map(section => (
            <button
              key={section.id}
              onClick={() => setActiveSection(section.id)}
              className={`px-3 py-1.5 rounded-lg text-xs transition-colors border ${
                activeSection === section.id
                  ? 'border-blue-500/60 bg-blue-600/20 text-blue-200'
                  : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10'
              }`}
            >
              {section.label}
            </button>
          ))}
        </nav>
      </header>

      {error && (
        <div className="px-6 py-2 bg-red-600/20 border-b border-red-500/40 text-red-200 flex items-center justify-between text-sm">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-200 hover:text-red-100">
            ✕
          </button>
        </div>
      )}

      <main className="flex-1 overflow-hidden bg-gradient-to-b from-black via-[#050505] to-black">
        <div className="h-full overflow-y-auto px-6 py-6 space-y-6">
          {!selectedGroup ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center space-y-4 max-w-md">
                <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center text-4xl">
                  👥
                </div>
                <div>
                  <h3 className="text-lg font-medium text-white/90 mb-2">No groups yet</h3>
                  <p className="text-sm text-white/50">Create your first attendance group to get started</p>
                </div>
                <button
                  onClick={() => setShowCreateGroupModal(true)}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/30 transition-colors text-sm flex items-center gap-2 mx-auto"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" strokeWidth={2.5}/></svg>
                  Create Group
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeSection === 'overview' && stats && (
            <section className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent p-4">
                  <p className="text-xs text-emerald-100/60 uppercase tracking-wider">Present Today</p>
                  <div className="text-2xl font-semibold text-emerald-200 mt-1">{stats.present_today}</div>
                  <p className="text-[10px] text-emerald-100/40 mt-1">out of {stats.total_members} members</p>
                </div>
                <div className="rounded-xl border border-rose-500/20 bg-gradient-to-br from-rose-500/20 via-rose-500/10 to-transparent p-4">
                  <p className="text-xs text-rose-100/60 uppercase tracking-wider">Absent Today</p>
                  <div className="text-2xl font-semibold text-rose-200 mt-1">{stats.absent_today}</div>
                  <p className="text-[10px] text-rose-100/40 mt-1">no check-in record</p>
                </div>
                <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-amber-500/20 via-amber-500/10 to-transparent p-4">
                  <p className="text-xs text-amber-100/60 uppercase tracking-wider">Late Today</p>
                  <div className="text-2xl font-semibold text-amber-200 mt-1">{stats.late_today}</div>
                  <p className="text-[10px] text-amber-100/40 mt-1">exceeded late threshold</p>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-sm font-semibold mb-3">Recent activity</h3>
                <div className="max-h-64 overflow-y-auto pr-2 space-y-2 text-sm">
                  {recentRecords.length > 0 ? (
                    recentRecords.slice(0, 24).map(record => {
                      const member = members.find(item => item.person_id === record.person_id);
                      return (
                        <div
                          key={record.id}
                          className="flex items-center justify-between py-2 border-b border-white/5 last:border-b-0"
                        >
                          <div>
                            <div className="font-medium text-white text-sm">{member?.name ?? record.person_id}</div>
                            <div className="text-xs text-white/40">
                              {toDate(record.timestamp).toLocaleDateString()} · {formatTime(record.timestamp)}
                            </div>
                          </div>
                          <div className="text-xs text-white/40">{(record.confidence * 100).toFixed(0)}%</div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-white/40 text-xs py-6 text-center">No activity</div>
                  )}
                </div>
              </div>
            </section>
          )}

              {activeSection === 'members' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Members</h2>
                <button
                  onClick={() => setShowAddMemberModal(true)}
                  className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-400/40 text-green-100 hover:bg-green-500/30 transition-colors text-xs"
                >
                  Add member
                </button>
              </div>

              {members.length > 0 && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                  {members.map(member => {
                    const session = todaySessions.find(item => item.person_id === member.person_id);

                    const statusLabel = session?.status === 'present'
                      ? 'Present'
                      : session?.status === 'late'
                        ? `Late (${session.late_minutes ?? 0}m)`
                        : session?.status === 'checked_out'
                          ? 'Checked out'
                          : session?.status === 'absent'
                            ? 'Absent'
                            : 'No record';

                    const statusClass = session?.status === 'present'
                      ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                      : session?.status === 'late'
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                        : session?.status === 'checked_out'
                          ? 'bg-white/10 text-white/70 border border-white/20'
                          : 'bg-rose-500/20 text-rose-200 border border-rose-400/40';

                    return (
                      <div key={member.person_id} className="rounded-xl border border-white/10 bg-white/5 p-4 flex flex-col gap-3">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="text-base font-semibold truncate">{member.name}</div>
                            <div className="text-xs text-white/50 mt-0.5">
                              {member.role && <span>{member.role} · </span>}
                              <span className="text-white/30">{member.person_id}</span>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded-lg text-xs font-medium whitespace-nowrap ${statusClass}`}>{statusLabel}</div>
                        </div>

                        <div className="flex gap-2 text-xs">
                          <button
                            onClick={() => openEditMember(member)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-100 hover:bg-blue-500/30 transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveMember(member.person_id)}
                            className="flex-1 px-3 py-1.5 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-100 hover:bg-rose-500/30 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          )}

              {activeSection === 'reports' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold">Reports</h2>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs">
                    <span className="text-white/40">From</span>
                    <input
                      type="date"
                      value={reportStartDate}
                      onChange={event => setReportStartDate(event.target.value)}
                      className="bg-transparent focus:outline-none w-28"
                    />
                  </label>
                  <label className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs">
                    <span className="text-white/40">To</span>
                    <input
                      type="date"
                      value={reportEndDate}
                      onChange={event => setReportEndDate(event.target.value)}
                      className="bg-transparent focus:outline-none w-28"
                    />
                  </label>
                  <button
                    onClick={generateReport}
                    className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-xs"
                  >
                    Refresh
                  </button>
                  <button
                    onClick={exportReport}
                    disabled={!report}
                    className="px-3 py-1.5 rounded-lg bg-green-500/20 border border-green-400/40 text-green-100 hover:bg-green-500/30 transition-colors text-xs disabled:opacity-50"
                  >
                    Export
                  </button>
                </div>
              </div>

              {report && (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-xl border border-blue-500/20 bg-gradient-to-br from-blue-500/20 via-blue-500/10 to-transparent p-4">
                      <p className="text-xs text-blue-100/60 uppercase tracking-wider">Days Tracked</p>
                      <div className="text-2xl font-semibold text-blue-200 mt-1">{report.summary.total_working_days}</div>
                      <p className="text-[10px] text-blue-100/40 mt-1">attendance taken</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/20 via-emerald-500/10 to-transparent p-4">
                    <p className="text-xs text-emerald-100/60 uppercase tracking-wider">Avg Attendance</p>
                    <div className="text-2xl font-semibold text-emerald-200 mt-1">{report.summary.average_attendance_rate}%</div>
                    <p className="text-[10px] text-emerald-100/40 mt-1">across all members</p>
                  </div>
                  <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="space-y-1">
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-white/50 uppercase tracking-wider">Most Punctual</p>
                        <span className="text-xs text-emerald-200 font-medium">{report.summary.most_punctual}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <p className="text-[10px] text-white/50 uppercase tracking-wider">Most Absent</p>
                        <span className="text-xs text-rose-200 font-medium">{report.summary.most_absent}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead className="bg-white/10 text-xs uppercase tracking-[0.2em] text-white/40">
                          <tr>
                            <th className="px-4 py-3 text-left">Name</th>
                            <th className="px-4 py-3 text-center">Present</th>
                            <th className="px-4 py-3 text-center">Absent</th>
                            <th className="px-4 py-3 text-center">Late</th>
                            <th className="px-4 py-3 text-center">Attendance %</th>
                          </tr>
                        </thead>
                        <tbody>
                          {report.members.map((member, index) => (
                            <tr key={member.person_id} className={index % 2 === 0 ? 'bg-white/5' : ''}>
                              <td className="px-4 py-3 text-sm font-medium text-white">{member.name}</td>
                              <td className="px-4 py-3 text-sm text-center text-emerald-200">{member.present_days}</td>
                              <td className="px-4 py-3 text-sm text-center text-rose-200">{member.absent_days}</td>
                              <td className="px-4 py-3 text-sm text-center text-amber-200">{member.late_days}</td>
                              <td className="px-4 py-3 text-sm text-center">
                                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                  member.attendance_rate >= 90
                                    ? 'bg-emerald-500/20 text-emerald-200 border border-emerald-400/40'
                                    : member.attendance_rate >= 75
                                      ? 'bg-amber-500/20 text-amber-200 border border-amber-400/40'
                                      : 'bg-rose-500/20 text-rose-200 border border-rose-400/40'
                                }`}
                                >
                                  {member.attendance_rate}%
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </section>
          )}

              {activeSection === 'registration' && (
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">Face registration</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowBulkRegistration(true)}
                    className="px-3 py-1.5 rounded-lg bg-purple-500/20 border border-purple-400/40 text-purple-100 hover:bg-purple-500/30 transition-colors text-xs"
                  >
                    📁 Bulk
                  </button>
                  <button
                    onClick={() => setShowCameraQueue(true)}
                    className="px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-400/40 text-cyan-100 hover:bg-cyan-500/30 transition-colors text-xs"
                  >
                    🎥 Camera
                  </button>
                </div>
              </div>

              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <FaceRegistrationLab
                  group={selectedGroup}
                  members={members}
                  onRefresh={() => {
                    if (selectedGroup) {
                      void fetchGroupDetails(selectedGroup.id);
                    }
                  }}
                />
              </div>
            </section>
          )}

              {activeSection === 'settings' && (
            <section className="space-y-4">
              <h2 className="text-lg font-semibold mb-4">Group Settings</h2>

              {/* Group Information Card */}
              <div className="rounded-xl border border-white/10 bg-gradient-to-br from-white/10 via-white/5 to-transparent p-5">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-white/10 flex items-center justify-center text-2xl">
                      {getGroupTypeIcon(selectedGroup.type)}
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">{selectedGroup.name}</h3>
                      <p className="text-xs text-white/50 capitalize">{selectedGroup.type}</p>
                    </div>
                  </div>
                  <button
                    onClick={openEditGroup}
                    className="px-3 py-1.5 rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-100 hover:bg-blue-500/30 transition-colors text-xs flex items-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" strokeWidth={2}/></svg>
                    Edit
                  </button>
                </div>

                {selectedGroup.description && (
                  <p className="text-sm text-white/70 mb-4 pb-4 border-b border-white/5">{selectedGroup.description}</p>
                )}

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                    <div className="text-xs text-white/50 mb-1">Total Members</div>
                    <div className="text-xl font-light text-white">{members.length}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 p-3 border border-white/10">
                    <div className="text-xs text-white/50 mb-1">Created</div>
                    <div className="text-sm font-light text-white">
                      {selectedGroupCreatedAt ? selectedGroupCreatedAt.toLocaleDateString() : '—'}
                    </div>
                  </div>
                </div>
              </div>

              {/* All Groups List */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 12h16.5m-16.5 3.75h16.5M3.75 19.5h16.5M5.625 4.5h12.75a1.875 1.875 0 010 3.75H5.625a1.875 1.875 0 010-3.75z" strokeWidth={2}/></svg>
                  All Groups
                </h3>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {groups.map(group => {
                    const isSelected = selectedGroup.id === group.id;
                    return (
                      <div
                        key={group.id}
                        className={`rounded-lg p-3 border transition-all cursor-pointer ${
                          isSelected
                            ? 'border-blue-500/40 bg-blue-500/10'
                            : 'border-white/10 bg-white/5 hover:bg-white/10'
                        }`}
                        onClick={() => setSelectedGroup(group)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 flex-1 min-w-0">
                            <span className="text-lg">{getGroupTypeIcon(group.type)}</span>
                            <div className="min-w-0 flex-1">
                              <div className="text-sm font-medium truncate">{group.name}</div>
                              <div className="text-xs text-white/40 capitalize">{group.type}</div>
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Data Management Tools */}
              <div className="rounded-xl border border-white/10 bg-white/5 p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                  <svg className="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" strokeWidth={2}/></svg>
                  Data Management
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  <button
                    onClick={async () => {
                      if (!confirm('Remove attendance records older than 30 days?')) {
                        return;
                      }
                      await trackAsync(async () => {
                        try {
                          setError(null);
                          await attendanceManager.cleanupOldData(30);
                          if (selectedGroup) {
                            await fetchGroupDetails(selectedGroup.id);
                          }
                        } catch (err) {
                          console.error('Error cleaning data:', err);
                          setError(err instanceof Error ? err.message : 'Failed to clean up old data');
                        }
                      });
                    }}
                    className="px-3 py-2 rounded-lg bg-amber-500/20 border border-amber-400/40 text-amber-100 hover:bg-amber-500/30 transition-colors text-xs flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth={2}/></svg>
                    Clean Old Records
                  </button>
                  <button
                    onClick={exportData}
                    className="px-3 py-2 rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-100 hover:bg-blue-500/30 transition-colors text-xs flex items-center justify-center gap-1.5"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" strokeWidth={2}/></svg>
                    Export Data
                  </button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="rounded-xl border border-rose-500/30 bg-gradient-to-br from-rose-500/10 to-transparent p-4">
                <h3 className="text-sm font-semibold mb-3 flex items-center gap-2 text-rose-200">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" strokeWidth={2}/></svg>
                  Danger Zone
                </h3>
                <p className="text-xs text-rose-200/60 mb-3">
                  Deleting this group will permanently remove all members and attendance records. This action cannot be undone.
                </p>
                <button
                  onClick={handleDeleteGroup}
                  disabled={loading}
                  className="w-full px-3 py-2 rounded-lg bg-rose-500/20 border border-rose-400/40 text-rose-100 hover:bg-rose-500/30 transition-colors text-xs flex items-center justify-center gap-1.5 disabled:opacity-50"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" strokeWidth={2}/></svg>
                  Delete Group
                </button>
              </div>
            </section>
              )}
            </>
          )}
        </div>
      </main>      {showAddMemberModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50 px-4">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 w-full max-w-2xl shadow-[0_40px_80px_rgba(0,0,0,0.6)] max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold mb-2">Add Members</h3>
            <p className="text-sm text-white/60 mb-4">Add one or multiple members to the group</p>
            
            {/* Tab selector */}
            <div className="flex gap-2 mb-4 border-b border-white/10 pb-2">
              <button
                onClick={() => {
                  setIsBulkMode(false);
                  setBulkMembersText('');
                }}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  !isBulkMode ? 'bg-blue-500/20 text-blue-200' : 'text-white/60 hover:text-white'
                }`}
              >
                Single Member
              </button>
              <button
                onClick={() => {
                  setIsBulkMode(true);
                  setNewMemberName('');
                  setNewMemberRole('');
                }}
                className={`px-4 py-2 text-sm rounded-lg transition ${
                  isBulkMode ? 'bg-blue-500/20 text-blue-200' : 'text-white/60 hover:text-white'
                }`}
              >
                Bulk Add
              </button>
            </div>

            {/* Single Member Form */}
            {!isBulkMode && (
              <div className="grid gap-4">
                <label className="text-sm">
                  <span className="text-white/60 block mb-2">Full name *</span>
                  <input
                    type="text"
                    value={newMemberName}
                    onChange={event => setNewMemberName(event.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500/60"
                    placeholder="Enter full name"
                  />
                </label>
                <label className="text-sm">
                  <span className="text-white/60 block mb-2">Role (optional)</span>
                  <input
                    type="text"
                    value={newMemberRole}
                    onChange={event => setNewMemberRole(event.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500/60"
                    placeholder="e.g. Staff, Student, Teacher"
                  />
                </label>
              </div>
            )}

            {/* Bulk Add Form */}
            {isBulkMode && (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60">Upload CSV/TXT file or paste below</span>
                    <label className="px-3 py-1 text-xs rounded-lg bg-blue-500/20 border border-blue-400/40 text-blue-200 hover:bg-blue-500/30 cursor-pointer transition">
                      📁 Upload File
                      <input
                        type="file"
                        accept=".txt,.csv"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) void handleFileUpload(file);
                          e.target.value = '';
                        }}
                      />
                    </label>
                  </div>
                  <textarea
                    value={bulkMembersText}
                    onChange={event => setBulkMembersText(event.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-blue-500/60 font-mono text-sm min-h-[200px]"
                    placeholder="Enter one member per line. Format:&#10;Name, Role (optional)&#10;&#10;Example:&#10;John Doe, Student&#10;Jane Smith, Teacher&#10;Bob Johnson"
                  />
                  <div className="mt-2 text-xs text-white/50">
                    Format: <span className="text-white/70 font-mono">Name, Role</span> (one per line, role is optional)
                  </div>
                </div>

                {/* Bulk Results */}
                {bulkResults && (
                  <div className={`rounded-xl border p-3 ${
                    bulkResults.failed === 0 
                      ? 'border-emerald-500/40 bg-emerald-500/10' 
                      : 'border-yellow-500/40 bg-yellow-500/10'
                  }`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold">
                        {bulkResults.failed === 0 ? '✓ Success!' : '⚠ Partial Success'}
                      </span>
                      <span className="text-xs">
                        {bulkResults.success} added, {bulkResults.failed} failed
                      </span>
                    </div>
                    {bulkResults.errors.length > 0 && (
                      <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                        {bulkResults.errors.map((err, idx) => (
                          <div key={idx} className="text-xs text-red-200 bg-red-500/10 rounded px-2 py-1">
                            {err}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  resetMemberForm();
                  setShowAddMemberModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
              >
                Cancel
              </button>
              {!isBulkMode ? (
                <button
                  onClick={handleAddMember}
                  disabled={!newMemberName.trim() || loading}
                  className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-400/40 text-green-100 hover:bg-green-500/30 transition-colors text-sm disabled:opacity-50"
                >
                  {loading ? 'Adding…' : 'Add Member'}
                </button>
              ) : (
                <button
                  onClick={() => void handleBulkAddMembers()}
                  disabled={!bulkMembersText.trim() || isProcessingBulk}
                  className="px-4 py-2 rounded-xl bg-green-500/20 border border-green-400/40 text-green-100 hover:bg-green-500/30 transition-colors text-sm disabled:opacity-50"
                >
                  {isProcessingBulk ? 'Processing…' : `Add Members`}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {showEditMemberModal && editingMember && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50 px-4">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-6 w-full max-w-lg shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
            <h3 className="text-xl font-semibold mb-4">Edit member</h3>
            <div className="grid gap-4">
              <label className="text-sm">
                <span className="text-white/60 block mb-2">Full name *</span>
                <input
                  type="text"
                  value={newMemberName}
                  onChange={event => setNewMemberName(event.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500/60"
                  placeholder="Enter full name"
                />
              </label>
              <label className="text-sm">
                <span className="text-white/60 block mb-2">Role (optional)</span>
                <input
                  type="text"
                  value={newMemberRole}
                  onChange={event => setNewMemberRole(event.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500/60"
                  placeholder="e.g. Staff, Student, Teacher"
                />
              </label>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  resetMemberForm();
                  setEditingMember(null);
                  setShowEditMemberModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleEditMember}
                disabled={!newMemberName.trim() || loading}
                className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-100 hover:bg-blue-500/30 transition-colors text-sm disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Save changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Registration Modal */}
      {showBulkRegistration && selectedGroup && (
        <BulkFaceRegistration
          group={selectedGroup}
          members={members}
          onRefresh={() => {
            if (selectedGroup) {
              void fetchGroupDetails(selectedGroup.id);
            }
          }}
          onClose={() => setShowBulkRegistration(false)}
        />
      )}

      {/* Assisted Camera Queue Modal */}
      {showCameraQueue && selectedGroup && (
        <AssistedCameraRegistration
          group={selectedGroup}
          members={members}
          onRefresh={() => {
            if (selectedGroup) {
              void fetchGroupDetails(selectedGroup.id);
            }
          }}
          onClose={() => setShowCameraQueue(false)}
        />
      )}

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50 px-4">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
            <h3 className="text-xl font-semibold mb-2">Create New Group</h3>
            <p className="text-sm text-white/60 mb-4">Set up a new attendance group</p>

            <div className="grid gap-4">
              <label className="text-sm">
                <span className="text-white/60 block mb-2">Group name *</span>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={event => setNewGroupName(event.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500/60"
                  placeholder="e.g. CS101 Section A, Engineering Team"
                />
              </label>

              <label className="text-sm">
                <span className="text-white/60 block mb-2">Group type *</span>
                <select
                  value={newGroupType}
                  onChange={event => setNewGroupType(event.target.value as GroupType)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500/60"
                >
                  <option value="general" className="bg-black">👥 General</option>
                  <option value="student" className="bg-black">🎓 Student</option>
                  <option value="employee" className="bg-black">👔 Employee</option>
                  <option value="visitor" className="bg-black">👤 Visitor</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="text-white/60 block mb-2">Description (optional)</span>
                <textarea
                  value={newGroupDescription}
                  onChange={event => setNewGroupDescription(event.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-emerald-500/60 min-h-[80px]"
                  placeholder="Brief description of this group..."
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  resetGroupForm();
                  setShowCreateGroupModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateGroup}
                disabled={!newGroupName.trim() || loading}
                className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-100 hover:bg-emerald-500/30 transition-colors text-sm disabled:opacity-50"
              >
                {loading ? 'Creating…' : 'Create Group'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Group Modal */}
      {showEditGroupModal && selectedGroup && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur flex items-center justify-center z-50 px-4">
          <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-[0_40px_80px_rgba(0,0,0,0.6)]">
            <h3 className="text-xl font-semibold mb-2">Edit Group</h3>
            <p className="text-sm text-white/60 mb-4">Update group information</p>

            <div className="grid gap-4">
              <label className="text-sm">
                <span className="text-white/60 block mb-2">Group name *</span>
                <input
                  type="text"
                  value={newGroupName}
                  onChange={event => setNewGroupName(event.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500/60"
                  placeholder="e.g. CS101 Section A, Engineering Team"
                />
              </label>

              <label className="text-sm">
                <span className="text-white/60 block mb-2">Group type *</span>
                <select
                  value={newGroupType}
                  onChange={event => setNewGroupType(event.target.value as GroupType)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500/60"
                >
                  <option value="general" className="bg-black">👥 General</option>
                  <option value="student" className="bg-black">🎓 Student</option>
                  <option value="employee" className="bg-black">👔 Employee</option>
                  <option value="visitor" className="bg-black">👤 Visitor</option>
                </select>
              </label>

              <label className="text-sm">
                <span className="text-white/60 block mb-2">Description (optional)</span>
                <textarea
                  value={newGroupDescription}
                  onChange={event => setNewGroupDescription(event.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 focus:outline-none focus:border-blue-500/60 min-h-[80px]"
                  placeholder="Brief description of this group..."
                />
              </label>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  resetGroupForm();
                  setShowEditGroupModal(false);
                }}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleEditGroup}
                disabled={!newGroupName.trim() || loading}
                className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-400/40 text-blue-100 hover:bg-blue-500/30 transition-colors text-sm disabled:opacity-50"
              >
                {loading ? 'Saving…' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
