"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    APP_NAME: str = "InvestiGate API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    API_PREFIX: str = "/api/v1"
    
    # Database - Support both SQLite (local) and Azure SQL (production)
    DATABASE_URL: Optional[str] = None  # If set, use this directly
    DB_SERVER: str = ""
    DB_NAME: str = "investigates"
    DB_USER: str = ""
    DB_PASSWORD: str = ""
    
    # JWT Settings
    JWT_SECRET_KEY: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:3000,https://wonderful-wave-0486dd100.6.azurestaticapps.net"
    
    @property
    def database_url(self) -> str:
        """Generate database connection string - supports SQLite and Azure SQL"""
        # If DATABASE_URL is explicitly set, use it (supports SQLite)
        if self.DATABASE_URL:
            return self.DATABASE_URL
        
        # Otherwise, build Azure SQL connection string
        if self.DB_SERVER and self.DB_PASSWORD:
            return f"mssql+pymssql://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_SERVER}/{self.DB_NAME}"
        
        # Default to SQLite for local development
        return "sqlite:///./investigates.db"
    
    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
