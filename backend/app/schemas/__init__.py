from typing import Generic, TypeVar, Optional
from pydantic import BaseModel

T = TypeVar('T')

class PaginationMeta(BaseModel):
    page: int = 1
    per_page: int = 20
    total: int = 0
    total_pages: int = 0

class APIResponse(BaseModel, Generic[T]):
    success: bool = True
    data: Optional[T] = None
    message: str = ''
    meta: Optional[PaginationMeta] = None
