/**
 * Helper utilities for managing local state caching of attendance members
 * to optimize rendering cycles and avoid redundant IPC/API database roundtrips.
 */

import { attendanceManager } from "@/services"
import type { AttendanceGroup, AttendanceMember } from "@/types/recognition"

/**
 * Retrieves a member's metadata from cache, falling back to a database lookup if not yet loaded.
 *
 * @param personId The unique identifier of the member to search.
 * @param currentGroup The group context to validate membership against. If provided,
 *   the returned member must match the group ID, otherwise `null` is returned.
 * @param memberCacheRef A reference to the Map caching the member lookups.
 * @returns A promise resolving to the member object and their computed display name,
 *   or `null` if the member is invalid or not in the target group.
 *
 * @remarks
 * In multi-camera or high-throughput recognition scenarios, this helper mitigates
 * database lock issues and IPC bottleneck overhead by caching lookup results locally
 * (including negative caching as `null` to avoid constant lookups for missing records).
 */
export async function getMemberFromCache(
  personId: string,
  currentGroup: AttendanceGroup | null,
  memberCacheRef: React.RefObject<Map<string, AttendanceMember | null>>,
): Promise<{ member: AttendanceMember | null; memberName: string } | null> {
  try {
    if (!memberCacheRef.current) return null
    let member = memberCacheRef.current.get(personId)
    if (!member && member !== null) {
      member = await attendanceManager.getMember(personId)
      memberCacheRef.current.set(personId, member || null)
    }

    if (currentGroup) {
      if (!member) {
        return null
      }
      const memberName = member.name || personId
      if (member.group_id !== currentGroup.id) {
        return null
      }
      return { member, memberName }
    } else {
      const memberName = member?.name || personId
      return { member: member || null, memberName }
    }
  } catch {
    if (memberCacheRef.current) {
      memberCacheRef.current.set(personId, null)
    }
    if (currentGroup) {
      return null
    } else {
      return { member: null, memberName: personId }
    }
  }
}
