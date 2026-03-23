from fastapi import Depends

from wallet.db import AsyncSession, get_db
from wallet.models.wallet import Wallet
from wallet.routes.kafka import kafka_router

from wallet.kafka.consumers.schema import KafkaEnvelope


@kafka_router.subscriber("auth.events", group_id="wallet-service")
async def handle_auth_events(envelope: KafkaEnvelope, db: AsyncSession = Depends(get_db)):
    print(envelope)
    event = envelope.payload.get("event")

    if event == "auth.user_registered":
        user_id = envelope.payload["userId"]
        user_id = envelope.payload["userId"]

        wallet = Wallet(user_id=user_id)
        db.add(wallet)
        await db.commit()
