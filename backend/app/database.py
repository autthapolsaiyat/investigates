"""
Database Configuration
SQLAlchemy setup - supports SQLite (local) and Azure SQL (production)
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
from app.config import settings

# Check if using SQLite
is_sqlite = settings.database_url.startswith("sqlite")

# Create SQLAlchemy engine with appropriate settings
if is_sqlite:
    # SQLite settings
    engine = create_engine(
        settings.database_url,
        connect_args={"check_same_thread": False},  # Required for SQLite
        echo=settings.DEBUG
    )
else:
    # Azure SQL / PostgreSQL settings
    engine = create_engine(
        settings.database_url,
        pool_pre_ping=True,
        pool_size=10,
        max_overflow=20,
        pool_recycle=3600,
        echo=settings.DEBUG
    )

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()


def get_db():
    """
    Dependency to get database session
    Use with FastAPI Depends()
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """
    Initialize database tables
    Call this on application startup
    """
    from app.models import user, organization, case, money_flow  # noqa
    from app.models import evidence  # noqa - import separately to avoid circular
    Base.metadata.create_all(bind=engine)
