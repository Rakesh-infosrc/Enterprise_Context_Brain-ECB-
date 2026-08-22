from fastapi import APIRouter

from .endpoints import (
    auth_router,
    query_router,
    projects_router,
    evidence_router,
    mcp_router,
    system_router,
)
from .webhooks import webhooks_router

router = APIRouter(prefix="/api/v1")

router.include_router(auth_router)
router.include_router(query_router)
router.include_router(projects_router)
router.include_router(evidence_router)
router.include_router(mcp_router)
router.include_router(system_router)
router.include_router(webhooks_router)
