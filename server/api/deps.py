from typing import AsyncGenerator, Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from database.session import AsyncSessionLocal
from database.repository import AttendanceRepository


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()


async def get_repository(
    session: Annotated[AsyncSession, Depends(get_db)],
) -> AttendanceRepository:
    return AttendanceRepository(session)
