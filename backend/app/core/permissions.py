from enum import Enum
from typing import Callable

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
    Role.SUPER_ADMIN: {},
    Role.ADMIN: {},
    Role.SALES_MANAGER: {},
    Role.SALES_EXECUTIVE: {},
    Role.MARKETING: {},
    Role.CUSTOMER_SUPPORT: {},
    Role.FINANCE: {}
}

def has_permission(role: Role, resource: Resource, permission: Permission) -> bool:
    if role == Role.SUPER_ADMIN:
        return True
    
    resource_perms = ROLE_PERMISSIONS.get(role, {}).get(resource, set())
    return permission in resource_perms

def require_permission(resource: Resource, permission: Permission) -> Callable:
    def dependency():
        pass
    return dependency
