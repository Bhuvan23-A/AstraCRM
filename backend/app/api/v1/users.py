from typing import Optional
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import get_current_active_user, require_admin
from app.models.user import User, UserRole
from app.schemas import APIResponse, PaginationMeta
from app.schemas.auth import UserCreate, UserUpdate, UserResponse
from app.services.auth import AuthService

router = APIRouter(prefix="/users", tags=["Users"])


@router.get("", response_model=APIResponse[list[UserResponse]])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    role: Optional[UserRole] = None,
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin()),
):
    users, total = await AuthService.get_users(db, skip=skip, limit=limit, role=role, search=search)
    page_num = (skip // limit) + 1
    total_pages = (total + limit - 1) // limit
    meta = PaginationMeta(page=page_num, per_page=limit, total=total, total_pages=total_pages)
    return APIResponse(
        success=True,
        data=[UserResponse.model_validate(u) for u in users],
        message="Users list retrieved successfully",
        meta=meta
    )


@router.post("", response_model=APIResponse[UserResponse], status_code=201)
async def create_user(
    data: UserCreate,
    db: AsyncSession = Depends(get_db),
    _: User = Depends(require_admin()),
):
    user = await AuthService.create_user(db, data)
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(user),
        message="User created successfully"
    )


@router.get("/{user_id}", response_model=APIResponse[UserResponse])
async def get_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    # Users can view themselves; admins can view anyone
    if str(current_user.id) != str(user_id) and current_user.role not in [UserRole.SUPER_ADMIN, UserRole.ADMIN]:
        raise HTTPException(status_code=403, detail="Access denied")
    user = await AuthService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(user),
        message="User details retrieved"
    )


@router.put("/{user_id}", response_model=APIResponse[UserResponse])
async def update_user(
    user_id: UUID,
    data: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    user = await AuthService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    # Only super_admin can change roles
    if data.role and current_user.role != UserRole.SUPER_ADMIN:
        data.role = None
    updated = await AuthService.update_user(db, user, data)
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(updated),
        message="User updated successfully"
    )


@router.delete("/{user_id}", response_model=APIResponse[None], status_code=200)
async def delete_user(
    user_id: UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin()),
):
    if str(current_user.id) == str(user_id):
        raise HTTPException(status_code=400, detail="Cannot delete yourself")
    user = await AuthService.get_user_by_id(db, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    await AuthService.delete_user(db, user)
    return APIResponse(
        success=True,
        data=None,
        message="User deleted successfully"
    )