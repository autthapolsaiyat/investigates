"""
InvestiGate API
Main FastAPI Application
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import init_db
from app.routers import (
    auth_router,
    users_router,
    organizations_router,
    cases_router,
    money_flow_router
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan events
    - Startup: Initialize database
    - Shutdown: Cleanup
    """
    # Startup
    print("🚀 Starting InvestiGate API...")
    init_db()
    print("✅ Database initialized")
    
    yield
    
    # Shutdown
    print("👋 Shutting down InvestiGate API...")


# Create FastAPI app
app = FastAPI(
    title=settings.APP_NAME,
    version=settings.APP_VERSION,
    description="""
    ## InvestiGate API
    
    Backend API for the InvestiGate investigation management platform.
    
    ### Features
    - 🔐 JWT Authentication
    - 👥 User & Organization Management
    - 📁 Case Management
    - 💰 Money Flow Graph
    
    ### Authentication
    All endpoints except `/auth/login` and `/auth/register` require Bearer token.
    """,
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)


# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Register routers
app.include_router(auth_router, prefix=settings.API_PREFIX)
app.include_router(users_router, prefix=settings.API_PREFIX)
app.include_router(organizations_router, prefix=settings.API_PREFIX)
app.include_router(cases_router, prefix=settings.API_PREFIX)
app.include_router(money_flow_router, prefix=settings.API_PREFIX)


# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """
    Health check endpoint for Azure App Service
    """
    return {
        "status": "healthy",
        "app": settings.APP_NAME,
        "version": settings.APP_VERSION
    }


# Root endpoint
@app.get("/", tags=["Root"])
async def root():
    """
    Root endpoint with API info
    """
    return {
        "message": "Welcome to InvestiGate API",
        "version": settings.APP_VERSION,
        "docs": "/docs",
        "health": "/health"
    }


# For local development
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True
    )
