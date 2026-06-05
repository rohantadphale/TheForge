from contextlib import asynccontextmanager
from collections.abc import AsyncGenerator

from fastapi import APIRouter, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from database import init_db
from routers import (
    attributes,
    campaigns,
    companions,
    dashboard,
    profile,
    quests,
    ranks,
    reflections,
    settings,
    weekly,
)


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncGenerator[None]:
    init_db()
    yield


app = FastAPI(title="TheForge API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

api_router = APIRouter(prefix="/api")
api_router.include_router(settings.router)
api_router.include_router(profile.router)
api_router.include_router(attributes.router)
api_router.include_router(ranks.router)
api_router.include_router(campaigns.router)
api_router.include_router(companions.router)
api_router.include_router(reflections.router)
api_router.include_router(weekly.router)
api_router.include_router(quests.router)
api_router.include_router(dashboard.router)
app.include_router(api_router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
