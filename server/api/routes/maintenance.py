import logging
from fastapi import APIRouter, HTTPException, Depends

from api.schemas import (
    SuccessResponse,
    CleanupRequest,
    ImportMetadataRequest,
    ImportMetadataResponse,
)
from api.deps import get_repository
from database.repository import AttendanceRepository

logger = logging.getLogger(__name__)

router = APIRouter(prefix="", tags=["maintenance"])


@router.post("/cleanup", response_model=SuccessResponse)
async def cleanup_old_data(
    cleanup_data: CleanupRequest,
    repo: AttendanceRepository = Depends(get_repository),
):
    """Clean up old attendance data"""
    try:
        days = cleanup_data.days_to_keep or 30
        results = await repo.cleanup_old_data(days)

        await repo.add_audit_log(
            action="DATA_CLEANUP_RUN",
            target_type="system",
            target_id="attendance_records",
            details=f"Cleanup for data older than {days} days. Deleted {results['records_deleted']} records and {results['sessions_deleted']} sessions.",
        )

        return SuccessResponse(
            message=f"Cleanup successful: {results['records_deleted']} records and {results['sessions_deleted']} sessions deleted."
        )

    except Exception as e:
        logger.error(f"Error cleaning up old data: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")


@router.post("/wipe", response_model=SuccessResponse)
async def remote_wipe_data(
    repo: AttendanceRepository = Depends(get_repository),
):
    """
    Comprehensive remote wipe:
    1. Clear all attendance records, sessions, and events.
    2. Clear all biometric face templates.
    """
    try:
        # 1. Clear attendance records from DB
        # We'll use a new method in repository to clear all
        results = await repo.clear_all_attendance_data()

        # 2. Clear face database via face_recognizer
        # We'll import get_face_recognizer to call it here
        from api.recognition_deps import get_face_recognizer

        face_recognizer = await get_face_recognizer()
        face_result = await face_recognizer.clear_database(repo.organization_id)

        await repo.add_audit_log(
            action="REMOTE_WIPE_EXECUTED",
            target_type="system",
            target_id="all_data",
            details=f"Remote wipe triggered. Records cleared: {results.get('records_deleted', 0)}. Biometrics cleared: {face_result.get('success', False)}",
        )

        return SuccessResponse(
            message="Remote wipe completed successfully. All local data erased."
        )

    except Exception as e:
        logger.error(f"Error during remote wipe: {e}")
        raise HTTPException(status_code=500, detail=f"Wipe failed: {str(e)}")


@router.post("/purge-history", response_model=SuccessResponse)
async def purge_attendance_history(
    repo: AttendanceRepository = Depends(get_repository),
):
    """
    Wipe all operational attendance transaction records and daily sessions.
    Preserves structural directories, members, and biometric faces.
    """
    try:
        results = await repo.clear_attendance_history()

        await repo.add_audit_log(
            action="ATTENDANCE_HISTORY_PURGED",
            target_type="system",
            target_id="history",
            details=f"All history logs manually purged. Records cleared: {results.get('records_deleted', 0)}. Sessions cleared: {results.get('sessions_deleted', 0)}.",
        )

        return SuccessResponse(
            message=f"Purged successfully. Records: {results.get('records_deleted', 0)}, Sessions: {results.get('sessions_deleted', 0)}."
        )

    except Exception as e:
        logger.error(f"Error during history purge: {e}")
        raise HTTPException(status_code=500, detail=f"Purge failed: {str(e)}")


@router.post("/import-metadata", response_model=ImportMetadataResponse)
async def import_metadata(
    request: ImportMetadataRequest,
    repo: AttendanceRepository = Depends(get_repository),
):
    """
    Import metadata (groups and members) pulled from the cloud dashboard.
    Does not affect existing local biometrics.
    """
    try:
        groups_count = 0
        for group in request.groups:
            existing_group = await repo.get_group(group.id)
            remote_id = group.remote_id or group.id
            group_payload = {
                "id": group.id,
                "name": group.name,
                "is_active": group.is_active,
                "settings": group.settings or {},
                "remote_id": remote_id,
            }
            if group.created_at:
                group_payload["created_at"] = group.created_at
            if existing_group:
                await repo.update_group(group.id, group_payload)
            else:
                await repo.create_group(group_payload)
            groups_count += 1

        members_count = 0
        for member in request.members:
            existing_member = await repo.get_member(member.person_id)
            remote_id = member.remote_id or member.person_id
            member_payload = {
                "person_id": member.person_id,
                "group_id": member.group_id,
                "name": member.name,
                "role": member.role,
                "email": member.email,
                "is_active": member.is_active,
                "has_consent": member.has_consent,
                "consent_granted_at": member.consent_granted_at,
                "consent_granted_by": member.consent_granted_by,
                "remote_id": remote_id,
            }
            if member.id:
                member_payload["id"] = member.id
            if member.joined_at:
                member_payload["joined_at"] = member.joined_at
            if existing_member:
                await repo.update_member(member.person_id, member_payload)
            else:
                # Ensure local group exists for SQLite FK constraints
                group_exists = await repo.get_group(member.group_id)
                if not group_exists:
                    logger.warning(
                        f"Group {member.group_id} not found locally for member {member.name}. Auto-creating Group."
                    )
                    await repo.create_group(
                        {
                            "id": member.group_id,
                            "name": f"Cloud Group ({member.group_id[:6]})",
                            "remote_id": member.group_id,
                        }
                    )
                await repo.add_member(member_payload)
            members_count += 1

        # Prune groups/members that were deleted from the cloud dashboard
        from database.models import AttendanceGroup, AttendanceMember
        from sqlalchemy import select

        pulled_group_ids = {g.id for g in request.groups}
        group_query = select(AttendanceGroup).where(
            AttendanceGroup.is_deleted.is_(False),
        )
        if pulled_group_ids:
            group_query = group_query.where(AttendanceGroup.id.notin_(pulled_group_ids))
        result = await repo.session.execute(group_query)
        for g in result.scalars().all():
            await repo.delete_group(g.id)

        pulled_member_ids = {m.person_id for m in request.members}
        member_query = select(AttendanceMember).where(
            AttendanceMember.is_deleted.is_(False),
        )
        if pulled_member_ids:
            member_query = member_query.where(
                AttendanceMember.person_id.notin_(pulled_member_ids)
            )
        result = await repo.session.execute(member_query)
        for m in result.scalars().all():
            m.is_active = False
            m.is_deleted = True

        # Prune orphan face embeddings for members that no longer exist in the roster
        from database.models import Face

        faces_to_prune = select(Face).where(
            Face.person_id.notin_(pulled_member_ids),
            Face.organization_id == repo.organization_id,
        )
        face_result = await repo.session.execute(faces_to_prune)
        pruned_faces = 0
        for face in face_result.scalars().all():
            await repo.session.delete(face)
            pruned_faces += 1

        await repo.session.commit()

        # Update in-memory face recognizer cache just in case any active member list shifted
        from core.lifespan import face_recognizer

        if face_recognizer:
            await face_recognizer.refresh_cache(repo.organization_id)

        await repo.add_audit_log(
            action="METADATA_PULL_IMPORTED",
            target_type="system",
            target_id="cloud_sync",
            details=f"Imported {groups_count} groups and {members_count} members from cloud dashboard metadata pull.",
        )

        return ImportMetadataResponse(
            success=True,
            groups_count=groups_count,
            members_count=members_count,
        )

    except Exception as e:
        logger.error(f"Error importing cloud metadata: {e}")
        await repo.session.rollback()
        raise HTTPException(
            status_code=500, detail=f"Import cloud metadata failed: {str(e)}"
        )
