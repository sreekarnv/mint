from datetime import datetime, timedelta, timezone

from cuid2 import cuid_wrapper
from fastauth.core.protocols import EventHooks
from fastauth.types import UserData

from auth.core.fastauth_config import auth as fa
from auth.kafka.producer import publish_user_registered, publish_email_verification

_generate_token = cuid_wrapper()


class AuthEventHooks(EventHooks):
    async def on_signup(self, user_data: UserData):
        await publish_user_registered(user_data=user_data)
        await self._send_verification_email(user_data)

    async def on_email_verify(self, user_data: UserData) -> None:
        await publish_email_verification(user_data=user_data)

    async def _send_verification_email(self, user_data: UserData) -> None:
        if not fa.config.token_adapter or not fa.email_dispatcher:
            return

        token = _generate_token()
        await fa.config.token_adapter.create_token(
            {
                "token": token,
                "user_id": user_data["id"],
                "token_type": "verification",
                "expires_at": datetime.now(timezone.utc) + timedelta(hours=24),
                "raw_data": None,
            }
        )
        await fa.email_dispatcher.send_verification_email(
            user_data, token, expires_in_minutes=1440
        )
