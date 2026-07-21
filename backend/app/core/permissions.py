from enum import Enum
from typing import Callable, Optional
from uuid import UUID

from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_access_token


class Permission(str, Enum):
    CREATE = "CREATE"
    READ = "READ"
    READ_OWN = "READ_OWN"
    READ_ALL = "READ_ALL"
    UPDATE = "UPDATE"
    UPDATE_OWN = "UPDATE_OWN"
    DELETE = "DELETE"
    EXPORT = "EXPORT"
    APPROVE = "APPROVE"


class Resource(str, Enum):
    USERS = "USERS"
    LEADS = "LEADS"
    CONTACTS = "CONTACTS"
    DEALS = "DEALS"
    PRODUCTS = "PRODUCTS"
    QUOTES = "QUOTES"
    ORDERS = "ORDERS"
    ACTIVITIES = "ACTIVITIES"
    TASKS = "TASKS"
    TICKETS = "TICKETS"
    REPORTS = "REPORTS"
    SETTINGS = "SETTINGS"


class Role(str, Enum):
    SUPER_ADMIN = "SUPER_ADMIN"
    ADMIN = "ADMIN"
    SALES_MANAGER = "SALES_MANAGER"
    SALES_EXECUTIVE = "SALES_EXECUTIVE"
    MARKETING = "MARKETING"
    CUSTOMER_SUPPORT = "CUSTOMER_SUPPORT"
    FINANCE = "FINANCE"


ROLE_PERMISSIONS: dict[Role, dict[Resource, set[Permission]]] = {
    Role.SUPER_ADMIN: {},   # handled via short-circuit in has_permission
    Role.ADMIN: {
        Resource.USERS: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.DELETE},
        Resource.LEADS: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.DELETE, Permission.EXPORT},
        Resource.CONTACTS: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.DELETE, Permission.EXPORT},
        Resource.DEALS: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.DELETE, Permission.APPROVE},
        Resource.PRODUCTS: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.DELETE},
        Resource.QUOTES: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.DELETE, Permission.APPROVE},
        Resource.ORDERS: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.DELETE},
        Resource.ACTIVITIES: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.DELETE},
        Resource.TASKS: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.DELETE},
        Resource.TICKETS: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.DELETE},
        Resource.REPORTS: {Permission.READ_ALL, Permission.EXPORT},
        Resource.SETTINGS: {Permission.READ, Permission.UPDATE},
    },
    Role.SALES_MANAGER: {
        Resource.LEADS: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.DELETE, Permission.EXPORT},
        Resource.CONTACTS: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.EXPORT},
        Resource.DEALS: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.APPROVE},
        Resource.PRODUCTS: {Permission.READ_ALL},
        Resource.QUOTES: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.APPROVE},
        Resource.ORDERS: {Permission.READ_ALL},
        Resource.ACTIVITIES: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE},
        Resource.TASKS: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.DELETE},
        Resource.TICKETS: {Permission.READ_ALL},
        Resource.REPORTS: {Permission.READ_ALL, Permission.EXPORT},
    },
    Role.SALES_EXECUTIVE: {
        Resource.LEADS: {Permission.CREATE, Permission.READ_OWN, Permission.UPDATE_OWN},
        Resource.CONTACTS: {Permission.CREATE, Permission.READ_OWN, Permission.UPDATE_OWN},
        Resource.DEALS: {Permission.CREATE, Permission.READ_OWN, Permission.UPDATE_OWN},
        Resource.PRODUCTS: {Permission.READ_ALL},
        Resource.QUOTES: {Permission.CREATE, Permission.READ_OWN, Permission.UPDATE_OWN},
        Resource.ORDERS: {Permission.READ_OWN},
        Resource.ACTIVITIES: {Permission.CREATE, Permission.READ_OWN, Permission.UPDATE_OWN},
        Resource.TASKS: {Permission.CREATE, Permission.READ_OWN, Permission.UPDATE_OWN},
    },
    Role.MARKETING: {
        Resource.LEADS: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE, Permission.EXPORT},
        Resource.CONTACTS: {Permission.READ_ALL, Permission.EXPORT},
        Resource.REPORTS: {Permission.READ_ALL},
    },
    Role.CUSTOMER_SUPPORT: {
        Resource.CONTACTS: {Permission.READ_ALL, Permission.UPDATE},
        Resource.TICKETS: {Permission.CREATE, Permission.READ_ALL, Permission.UPDATE},
        Resource.ACTIVITIES: {Permission.CREATE, Permission.READ_OWN, Permission.UPDATE_OWN},
        Resource.TASKS: {Permission.CREATE, Permission.READ_OWN, Permission.UPDATE_OWN},
    },
    Role.FINANCE: {
        Resource.ORDERS: {Permission.READ_ALL, Permission.UPDATE},
        Resource.QUOTES: {Permission.READ_ALL, Permission.APPROVE},
        Resource.REPORTS: {Permission.READ_ALL, Permission.EXPORT},
    },
}


def has_permission(role: Role, resource: Resource, permission: Permission) -> bool:
    if role == Role.SUPER_ADMIN:
        return True
    resource_perms = ROLE_PERMISSIONS.get(role, {}).get(resource, set())
    return permission in resource_perms


def require_permission(resource: Resource, permission: Permission) -> Callable:
    async def dependency(current_user=Depends(get_current_active_user)):
        user_role = Role(current_user.role)
        if not has_permission(user_role, resource, permission):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required permission: {resource.value}:{permission.value}",
            )
        return current_user
    return dependency


# ── JWT / User auth dependencies ──────────────────────────────────────────────

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/v1/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
):
    """Decode JWT and return the active User model instance."""
    # import here to avoid circular imports at module load time
    from app.models.user import User

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id: Optional[str] = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


async def get_current_active_user(current_user=Depends(get_current_user)):
    if not current_user.is_active:
        raise HTTPException(status_code=400, detail="Inactive user")
    return current_user


def require_roles(*roles: Role):
    async def role_checker(current_user=Depends(get_current_active_user)):
        if current_user.role not in [r.value for r in roles]:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Access denied. Required roles: {[r.value for r in roles]}",
            )
        return current_user
    return role_checker


def require_admin():
    return require_roles(Role.SUPER_ADMIN, Role.ADMIN)


def require_super_admin():
    return require_roles(Role.SUPER_ADMIN)