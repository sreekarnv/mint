from fastapi import Depends
from pydantic import BaseModel

from wallet.db import AsyncSession, get_db
from wallet.models.wallet import Wallet
from wallet.routes.kafka import kafka_router


class KafkaEnvelope(BaseModel):
    topic: str
    eventId: str
    version: str
    actorId: str
    payload: dict


@kafka_router.subscriber("auth.events")
async def handle_auth_events(envelope: KafkaEnvelope, db: AsyncSession = Depends(get_db)):
    print("HERE HELLO IN KAFKA")
    event = envelope.payload.get("event")

    if event == "auth.user_registered":
        user_id = envelope.payload["userId"]
        user_id = envelope.payload["userId"]

        wallet = Wallet(user_id=user_id)
        db.add(wallet)
        await db.commit()
