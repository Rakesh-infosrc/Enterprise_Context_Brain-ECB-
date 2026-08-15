from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import get_db
from app.context_engine.hybrid_retriever import HybridRetriever

router = APIRouter()

@router.get("/inspect/{project_code}")
async def inspect_context(project_code: str, db: AsyncSession = Depends(get_db)):
    retriever = HybridRetriever()
    return await retriever.retrieve_context(db, project_code, "inspect")
