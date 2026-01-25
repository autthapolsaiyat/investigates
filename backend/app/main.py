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

# Diagnostic endpoint to check router loading
router_errors = []
router_status = []

@app.get("/")
async def root():
    return {"message": "Welcome to InvestiGate API", "docs": "/docs"}

@app.get("/debug/routers")
async def debug_routers():
    return {
        "loaded": router_status,
        "errors": router_errors,
        "total_loaded": len(router_status),
        "total_errors": len(router_errors)
    }

# Import routers after app is created
import traceback

routers_to_load = [
    ("auth", "app.routers.auth", "router"),
    ("users", "app.routers.users", "router"),
    ("organizations", "app.routers.organizations", "router"),
    ("cases", "app.routers.cases", "router"),
    ("money_flow", "app.routers.money_flow", "router"),
    ("registrations", "app.routers.registrations", "router"),
    ("support", "app.routers.support", "router"),
    ("evidence", "app.routers.evidence", "router"),
    ("login_history", "app.routers.login_history", "router"),
    ("licenses", "app.routers.licenses", "router"),
]

for name, module_path, router_attr in routers_to_load:
    try:
        import importlib
        module = importlib.import_module(module_path)
        router = getattr(module, router_attr)
        app.include_router(router, prefix=settings.API_PREFIX)
        router_status.append({"name": name, "status": "loaded"})
    except Exception as e:
        error_detail = {
            "name": name,
            "error": str(e),
            "traceback": traceback.format_exc()
        }
        router_errors.append(error_detail)
