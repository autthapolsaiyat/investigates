"""
Application Configuration
Load settings from environment variables
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # App Info
    APP_NAME: str = "InvestiGate API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    
    # API Settings
    API_PREFIX: str = "/api/v1"
    
    # Database - Azure SQL
    DB_SERVER: str = "your-server.database.windows.net"
    DB_NAME: str = "investigates"
    DB_USER: str = "admin"
    DB_PASSWORD: str = ""
    DB_DRIVER: str = "ODBC Driver 18 for SQL Server"
    
    # JWT Settings
    JWT_SECRET_KEY: str = "your-super-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    CORS_ORIGINS: str = "http://localhost:5173,https://wonderful-wave-0486dd100.6.azurestaticapps.net"
    
    # Azure App Service
    WEBSITE_HOSTNAME: Optional[str] = None
    
    @property
    def database_url(self) -> str:
        """Generate database connection string for Azure SQL"""
        return (
            f"mssql+pyodbc://{self.DB_USER}:{self.DB_PASSWORD}@{self.DB_SERVER}/"
            f"{self.DB_NAME}?driver={self.DB_DRIVER.replace(' ', '+')}"
            f"&Encrypt=yes&TrustServerCertificate=no&Connection+Timeout=30"
        )
    
    @property
    def cors_origins_list(self) -> list[str]:
        """Parse CORS origins from comma-separated string"""
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",")]
    
    class Config:
        env_file = ".env"
        case_sensitive = True


@lru_cache()
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()


settings = get_settings()
