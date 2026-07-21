from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.permissions import get_current_active_user
from app.models.user import User
from app.schemas import APIResponse
from app.schemas.auth import (
    LoginRequest, TokenResponse, UserCreate, UserResponse, PasswordChange
)
from app.services.auth import AuthService
from app.core.security import verify_password, hash_password

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=APIResponse[TokenResponse])
async def login(data: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await AuthService.authenticate(db, data.email, data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=400, detail="Account is deactivated")
    token = AuthService.create_token(user)
    return APIResponse(
        success=True,
        data=TokenResponse(access_token=token, user=UserResponse.model_validate(user)),
        message="Login successful"
    )


@router.post("/register", response_model=APIResponse[UserResponse], status_code=201)
async def register(data: UserCreate, db: AsyncSession = Depends(get_db)):
    """Public registration — creates sales_executive by default."""
    from app.models.user import UserRole
    data.role = UserRole.SALES_EXECUTIVE  # Force role on public register
    user = await AuthService.create_user(db, data)
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(user),
        message="User registered successfully"
    )


@router.get("/me", response_model=APIResponse[UserResponse])
async def get_me(current_user: User = Depends(get_current_active_user)):
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(current_user),
        message="Profile retrieved"
    )


@router.put("/me", response_model=APIResponse[UserResponse])
async def update_me(
    data: dict,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    from app.schemas.auth import UserUpdate
    update_data = UserUpdate(**{k: v for k, v in data.items() if k in ["full_name", "phone", "bio", "avatar_url"]})
    user = await AuthService.update_user(db, current_user, update_data)
    return APIResponse(
        success=True,
        data=UserResponse.model_validate(user),
        message="Profile updated successfully"
    )


@router.post("/change-password", response_model=APIResponse[None])
async def change_password(
    data: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_active_user),
):
    if not verify_password(data.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    current_user.hashed_password = hash_password(data.new_password)
    await db.commit()
    return APIResponse(
        success=True,
        data=None,
        message="Password updated successfully"
    )