import { useState, useRef, useCallback, useEffect } from "react";
import { attendanceManager } from "../../../services/AttendanceManager";
import type { AttendanceGroup, AttendanceMember, AttendanceRecord } from "../../../types/recognition";

interface UseAttendanceGroupsOptions {
  setError: (error: string | null) => void;
  setAttendanceCooldownSeconds: (seconds: number) => void;
}

export function useAttendanceGroups(options: UseAttendanceGroupsOptions) {
  const { setError, setAttendanceCooldownSeconds } = options;

  const [currentGroup, setCurrentGroupInternal] = useState<AttendanceGroup | null>(null);
  const currentGroupRef = useRef<AttendanceGroup | null>(null);
  const memberCacheRef = useRef<Map<string, AttendanceMember | null>>(new Map());
  const [attendanceGroups, setAttendanceGroups] = useState<AttendanceGroup[]>([]);
  const [groupMembers, setGroupMembers] = useState<AttendanceMember[]>([]);
  const [recentAttendance, setRecentAttendance] = useState<AttendanceRecord[]>([]);
  const [showGroupManagement, setShowGroupManagement] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<AttendanceGroup | null>(null);
  const [newGroupName, setNewGroupName] = useState("");
  const loadAttendanceDataRef = useRef<() => Promise<void>>(async () => {});

  const setCurrentGroup = useCallback((group: AttendanceGroup | null) => {
    setCurrentGroupInternal(group);
    currentGroupRef.current = group;
    memberCacheRef.current.clear();
    if (group) {
      localStorage.setItem("suri_selected_group_id", group.id);
    } else {
      localStorage.removeItem("suri_selected_group_id");
    }
  }, []);

  const loadSettings = useCallback(async () => {
    try {
      const settings = await attendanceManager.getSettings();
      setAttendanceCooldownSeconds(settings.attendance_cooldown_seconds ?? 10);
    } catch (error) {
      console.error("Failed to load settings:", error);
    }
  }, [setAttendanceCooldownSeconds]);

  const loadAttendanceData = useCallback(async () => {
    try {
      const currentGroupValue = currentGroupRef.current;
      const groups = await attendanceManager.getGroups();
      setAttendanceGroups(groups);

      if (!currentGroupValue) {
        return;
      }

      const groupStillExists = groups.some(
        (group) => group.id === currentGroupValue.id,
      );
      if (!groupStillExists) {
        setTimeout(() => {
          attendanceManager.getGroups().then((latestGroups) => {
            const stillMissing = !latestGroups.some(
              (group) => group.id === currentGroupValue.id,
            );
            if (stillMissing) {
              setCurrentGroup(null);
              setGroupMembers([]);
              setRecentAttendance([]);
            }
          });
        }, 100);
        return;
      }

      const [members, , records] = await Promise.all([
        attendanceManager.getGroupMembers(currentGroupValue.id),
        attendanceManager.getGroupStats(currentGroupValue.id),
        attendanceManager.getRecords({
          group_id: currentGroupValue.id,
          limit: 100,
        }),
      ]);

      setGroupMembers(members);
      setRecentAttendance(records);
    } catch (error) {
      console.error("❌ Failed to load attendance data:", error);
    }
  }, [setCurrentGroup]);

  useEffect(() => {
    loadAttendanceDataRef.current = loadAttendanceData;
  }, [loadAttendanceData]);

  const handleSelectGroup = useCallback(
    async (group: AttendanceGroup) => {
      setCurrentGroup(group);

      try {
        const [members, , records] = await Promise.all([
          attendanceManager.getGroupMembers(group.id),
          attendanceManager.getGroupStats(group.id),
          attendanceManager.getRecords({
            group_id: group.id,
            limit: 100,
          }),
        ]);

        setGroupMembers(members);
        setRecentAttendance(records);
      } catch (error) {
        console.error("❌ Failed to load data for selected group:", error);
      }
    },
    [setCurrentGroup],
  );

  const handleCreateGroup = useCallback(async () => {
    if (!newGroupName.trim()) return;

    try {
      const group = await attendanceManager.createGroup(newGroupName.trim());
      setNewGroupName("");
      setShowGroupManagement(false);
      await loadAttendanceData();

      await handleSelectGroup(group);
    } catch (error) {
      console.error("❌ Failed to create group:", error);
      setError("Failed to create group");
    }
  }, [newGroupName, loadAttendanceData, handleSelectGroup, setError]);

  const handleDeleteGroup = useCallback((group: AttendanceGroup) => {
    setGroupToDelete(group);
    setShowDeleteConfirmation(true);
  }, []);

  const confirmDeleteGroup = useCallback(async () => {
    if (!groupToDelete) return;

    try {
      const success = await attendanceManager.deleteGroup(groupToDelete.id);
      if (success) {
        if (currentGroup?.id === groupToDelete.id) {
          setCurrentGroup(null);
          setGroupMembers([]);
          setRecentAttendance([]);
        }

        await loadAttendanceData();
      } else {
        throw new Error("Failed to delete group");
      }
    } catch (error) {
      console.error("❌ Failed to delete group:", error);
      setError("Failed to delete group");
    } finally {
      setShowDeleteConfirmation(false);
      setGroupToDelete(null);
    }
  }, [groupToDelete, currentGroup, loadAttendanceData, setCurrentGroup, setError]);

  const cancelDeleteGroup = useCallback(() => {
    setShowDeleteConfirmation(false);
    setGroupToDelete(null);
  }, []);

  useEffect(() => {
    const initializeAttendance = async () => {
      try {
        await loadSettings();
        const groups = await attendanceManager.getGroups();
        setAttendanceGroups(groups);

        if (groups.length === 0) {
          setCurrentGroup(null);
        } else if (!currentGroup) {
          const savedGroupId = localStorage.getItem("suri_selected_group_id");
          let groupToSelect = null;

          if (savedGroupId) {
            groupToSelect = groups.find((group) => group.id === savedGroupId);
          }

          if (!groupToSelect) {
            groupToSelect = groups[0];
          }

          await handleSelectGroup(groupToSelect);
        }
      } catch (error) {
        console.error("Failed to initialize attendance system:", error);
        setError("Failed to initialize attendance system");
      }
    };

    initializeAttendance().catch((error) => {
      console.error("Error in initializeAttendance:", error);
    });
  }, [handleSelectGroup, loadSettings, currentGroup, setCurrentGroup, setError]);

  return {
    currentGroup,
    setCurrentGroup,
    currentGroupRef,
    memberCacheRef,
    attendanceGroups,
    setAttendanceGroups,
    groupMembers,
    setGroupMembers,
    recentAttendance,
    setRecentAttendance,
    showGroupManagement,
    setShowGroupManagement,
    showDeleteConfirmation,
    setShowDeleteConfirmation,
    groupToDelete,
    setGroupToDelete,
    newGroupName,
    setNewGroupName,
    loadSettings,
    loadAttendanceData,
    loadAttendanceDataRef,
    handleSelectGroup,
    handleCreateGroup,
    handleDeleteGroup,
    confirmDeleteGroup,
    cancelDeleteGroup,
  };
}

