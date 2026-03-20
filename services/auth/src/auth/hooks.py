from datetime import datetime, timezone
from uuid import uuid4

from fastauth.core.protocols import EventHooks
from fastauth.types import UserData

from auth.kafka.router import kafka_router


class AuthEventHooks(EventHooks):
    async def on_signup(self, user: UserData):
        print("CALLING ON SIGNUP", user)
        await kafka_router.broker.publish(
            message={
                "topic": "auth.events",
                "eventId": str(uuid4()),
                "timestamp": datetime.now(timezone.utc).isoformat(),
                "version": "1",
                "actorId": str(user["id"]),
                "payload": {
                    "event": "auth.user_registered",
                    "userId": str(user["id"]),
                    "email": user["email"],
                    "name": user.get("name") or "",
                    "registrationMethod": "credentials",
                },
            },
            topic="auth.events",
        )
