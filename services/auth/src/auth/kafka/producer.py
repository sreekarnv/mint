from datetime import datetime, timezone
from uuid import uuid4

from auth.kafka.router import kafka_router


async def publish_user_registered(user_id: str, email: str, name: str) -> None:
    await kafka_router.broker.publish(
        message={
            "topic": "auth.events",
            "eventId": str(uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1",
            "actorId": user_id,
            "payload": {
                "event": "auth.user_registered",
                "userId": user_id,
                "email": email,
                "name": name,
                "registrationMethod": "credentials",
            },
        },
        topic="auth.events",
    )
