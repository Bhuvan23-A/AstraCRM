import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.core.exceptions import register_exception_handlers
from app.api.v1 import api_router

logger = logging.getLogger(__name__)

app = FastAPI(title=settings.APP_NAME, version=settings.APP_VERSION)

origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(',')] if settings.CORS_ORIGINS else []

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

register_exception_handlers(app)

app.include_router(api_router)

@app.on_event("startup")
async def startup_event():
    logger.info(f"Starting up {settings.APP_NAME}...")
