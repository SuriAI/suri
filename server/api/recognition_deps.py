from fastapi import HTTPException
import core.lifespan


async def get_face_recognizer():
    """
    Dependency to provide the face recognizer instance.
    Raises a 500 error if it's not initialized.
    """
    if not core.lifespan.face_recognizer:
        raise HTTPException(
            status_code=500,
            detail="Face recognizer is not initialized or not available.",
        )
    return core.lifespan.face_recognizer
