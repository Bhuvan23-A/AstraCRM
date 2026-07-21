from datetime import datetime
from typing import Optional
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import hash_password, verify_password, create_access_token
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate, UserUpdate


class AuthService:

    @staticmethod
    async def create_user(db: AsyncSession, data: UserCreate) -> User:
        existing = await db.execute(select(User).where(User.email == data.email))
        if existing.scalar_one_or_none():
            from fastapi import HTTPException
            raise HTTPException(status_code=400, detail="Email already registered")

        # role comes in as UserRole enum, store as string value
        role_value = data.role.value if isinstance(data.role, UserRole) else data.role

        user = User(
            email=data.email,
            full_name=data.full_name,
            hashed_password=hash_password(data.password),
            role=role_value,
            phone=data.phone,
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def authenticate(db: AsyncSession, email: str, password: str) -> Optional[User]:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not verify_password(password, user.hashed_password):
            return None
        user.last_login_at = datetime.utcnow()
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    def create_token(user: User) -> str:
        # role is a plain string in DB e.g. "SUPER_ADMIN"
        role = user.role if isinstance(user.role, str) else user.role.value
        return create_access_token({"sub": str(user.id), "role": role})

    @staticmethod
    async def get_users(
        db: AsyncSession,
        skip: int = 0,
        limit: int = 50,
        role: Optional[UserRole] = None,
        search: Optional[str] = None,
    ):
        query = select(User)
        if role:
            role_value = role.value if isinstance(role, UserRole) else role
            query = query.where(User.role == role_value)
        if search:
            query = query.where(
                (User.full_name.ilike(f"%{search}%")) | (User.email.ilike(f"%{search}%"))
            )

        count_query = select(func.count()).select_from(query.subquery())
        total_result = await db.execute(count_query)
        total = total_result.scalar()

        result = await db.execute(
            query.offset(skip).limit(limit).order_by(User.created_at.desc())
        )
        users = result.scalars().all()
        return users, total

    @staticmethod
    async def get_user_by_id(db: AsyncSession, user_id: UUID) -> Optional[User]:
        result = await db.execute(select(User).where(User.id == user_id))
        return result.scalar_one_or_none()

    @staticmethod
    async def update_user(db: AsyncSession, user: User, data: UserUpdate) -> User:
        update_data = data.model_dump(exclude_unset=True)

        # convert role enum to string if present
        if "role" in update_data and isinstance(update_data["role"], UserRole):
            update_data["role"] = update_data["role"].value

        for field, value in update_data.items():
            setattr(user, field, value)

        user.updated_at = datetime.utcnow()
        await db.commit()
        await db.refresh(user)
        return user

    @staticmethod
    async def delete_user(db: AsyncSession, user: User):
        await db.delete(user)
        await db.commit()