from fastapi import APIRouter

from api.routes import (
    groups,
    members,
    records,
    stats,
    config,
    maintenance,
)


router = APIRouter(prefix="/attendance")


router.include_router(groups.router)
router.include_router(members.router)
router.include_router(records.router)
router.include_router(stats.router)
router.include_router(config.router)
router.include_router(maintenance.router)


face_detector = None
face_recognizer = None
