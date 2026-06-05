from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.engine import Connection

from database import get_db
from models import campaigns, quests
from schemas import Campaign, CampaignWithQuests

from .utils import get_by_id


router = APIRouter(prefix="/campaigns", tags=["campaigns"])


@router.get("", response_model=list[Campaign])
def get_campaigns(conn: Connection = Depends(get_db)) -> list[dict]:
    return list(conn.execute(select(campaigns).order_by(campaigns.c.id)).mappings().all())


@router.get("/{campaign_id}", response_model=CampaignWithQuests)
def get_campaign(campaign_id: int, conn: Connection = Depends(get_db)) -> dict:
    campaign = get_by_id(conn, campaigns, campaign_id, "Campaign not found")
    campaign_quests = conn.execute(
        select(quests)
        .where(quests.c.campaign_id == campaign_id, quests.c.is_archived == 0)
        .order_by(quests.c.id)
    ).mappings().all()
    return {**campaign, "quests": list(campaign_quests)}
