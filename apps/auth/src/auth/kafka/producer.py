from datetime import datetime, timezone
from uuid import uuid4

from fastauth.types import UserData

from auth.kafka.router import kafka_router


async def publish_user_registered(user_data: UserData) -> None:
    await kafka_router.broker.publish(
        message={
            "topic": "auth.events",
            "eventId": str(uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1",
            "actorId": user_data["id"],
            "payload": {
                "event": "auth.user_registered",
                "userId": user_data["id"],
                "email": user_data["email"],
                "name": user_data["name"],
                "registrationMethod": "credentials",
            },
        },
        topic="auth.events",
    )


async def publish_email_verification(user_data: UserData) -> None:
    await kafka_router.broker.publish(
        message={
            "topic": "auth.events",
            "eventId": str(uuid4()),
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "version": "1",
            "actorId": str(user_data["id"]),
            "payload": {
                "event": "auth.user_verified",
                "userId": str(user_data["id"]),
                "email": user_data["email"],
                "verifiedAt": datetime.now(timezone.utc).isoformat(),
            },
        },
        topic="auth.events",
    )