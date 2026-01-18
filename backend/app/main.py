"""
InvestiGate API
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("🚀 Starting InvestiGate API...")
    # Initialize database tables
    print("📦 Initializing database...")
    init_db()
    print("✅ Database ready!")
    yield
    print("👋 Shutting down...")


app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check - no DB
@app.get("/health")
async def health_check():
    return {"status": "healthy", "app": settings.APP_NAME, "version": settings.APP_VERSION}

@app.get("/")
async def root():
    return {"message": "Welcome to InvestiGate API", "docs": "/docs"}

# Import routers after app is created
try:
    from app.routers import auth_router, users_router, organizations_router, cases_router, money_flow_router
    app.include_router(auth_router, prefix=settings.API_PREFIX)
    app.include_router(users_router, prefix=settings.API_PREFIX)
    app.include_router(organizations_router, prefix=settings.API_PREFIX)
    app.include_router(cases_router, prefix=settings.API_PREFIX)
    app.include_router(money_flow_router, prefix=settings.API_PREFIX)
    
    # Import evidence router separately to avoid circular import
    from app.routers.evidence import router as evidence_router
    app.include_router(evidence_router, prefix=settings.API_PREFIX)
    print("✅ All routers loaded successfully")
except Exception as e:
    print(f"⚠️ Could not load routers: {e}")
