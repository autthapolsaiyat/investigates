"""
API Routers
Export all routers for registration
Note: evidence_router imported separately in main.py to avoid circular import
"""
from app.routers.auth import router as auth_router
from app.routers.users import router as users_router
from app.routers.organizations import router as organizations_router
from app.routers.cases import router as cases_router
from app.routers.money_flow import router as money_flow_router
from app.routers.registrations import router as registrations_router
from app.routers.support import router as support_router
from app.routers.login_history import router as login_history_router

__all__ = [
    "auth_router",
    "users_router",
    "organizations_router",
    "cases_router",
    "money_flow_router",
    "registrations_router",
    "support_router",
    "login_history_router"
]
