from fastapi import APIRouter
from app.api.v1 import health, crm

api_router = APIRouter(prefix='/api/v1')
api_router.include_router(health.router, tags=['Health'])
api_router.include_router(crm.router)
