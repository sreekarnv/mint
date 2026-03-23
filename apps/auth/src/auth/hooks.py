from fastauth.core.protocols import EventHooks
from fastauth.types import UserData

from auth.kafka.producer import publish_user_registered


class AuthEventHooks(EventHooks):
    async def on_signup(self, user_data: UserData):
        await publish_user_registered(user_data=user_data)
