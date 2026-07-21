from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = 'Sanna CRM'
    APP_VERSION: str = '1.0.0'
    APP_ENV: str = 'development'
    DATABASE_URL: str
    DATABASE_URL_SYNC: str = ''
    JWT_SECRET_KEY: str
    JWT_ALGORITHM: str = 'HS256'
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 15
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    CORS_ORIGINS: str = 'http://localhost:3000,http://localhost:5173'
    UPLOAD_DIR: str = '/app/uploads'
    MAX_UPLOAD_SIZE_MB: int = 10

    # Auth additions
    SUPER_ADMIN_EMAIL: str = 'admin@astracrm.com'
    SUPER_ADMIN_PASSWORD: str = 'Admin@1234'
    SUPER_ADMIN_NAME: str = 'Super Admin'

    class Config:
        env_file = ".env"

settings = Settings()