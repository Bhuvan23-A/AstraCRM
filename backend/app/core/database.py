import uuid
from datetime import datetime
from typing import AsyncGenerator

from sqlalchemy import DateTime, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

from app.core.config import settings

engine = create_async_engine(settings.DATABASE_URL, echo=True)
AsyncSessionLocal = async_sessionmaker(engine, expire_on_commit=False, class_=AsyncSession)


class Base(DeclarativeBase):
    pass


class BaseModel(Base):
    __abstract__ = True

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now())
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=func.now(), onupdate=func.now())
    created_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), nullable=True)
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        yield session


async def init_db():
    """Called on startup. Seeds super admin if no users exist."""
    from sqlalchemy import select, func as sql_func
    from app.models.user import User
    from app.core.security import hash_password
    from app.core.config import settings as cfg
    from app.core.permissions import Role

    async with AsyncSessionLocal() as db:
        try:
            result = await db.execute(select(sql_func.count()).select_from(User))
            count = result.scalar()
            if count == 0:
                admin = User(
                    email=cfg.SUPER_ADMIN_EMAIL,
                    full_name=cfg.SUPER_ADMIN_NAME,
                    hashed_password=hash_password(cfg.SUPER_ADMIN_PASSWORD),
                    role=Role.SUPER_ADMIN.value,
                    is_active=True,
                )
                db.add(admin)
                await db.commit()
                print(f"[Database] Super admin seeded: {cfg.SUPER_ADMIN_EMAIL}")
        except Exception as e:
            print(f"[Database] Seed skipped (table may not exist yet): {e}")