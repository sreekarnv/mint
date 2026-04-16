import pytest

from unittest.mock import AsyncMock, MagicMock
from wallet.kafka.consumers.auth_events import handle_auth_events
from wallet.kafka.consumers.schema import KafkaEnvelope
from wallet.models.wallet import Wallet


def make_envelope(event: str, payload_extra: dict = {}) -> KafkaEnvelope:
    return KafkaEnvelope(
        topic="auth.events",
        eventId="evt-1",
        version="1",
        actorId="u-1",
        payload={"event": event, **payload_extra},
    )


@pytest.fixture
def db_session():
    session = AsyncMock()
    session.commit = AsyncMock()
    session.add = MagicMock()
    return session


class TestHandleAuthEvents:
    @pytest.mark.asyncio
    async def test_user_registered_creates_wallet(self, db_session):
        envelope = make_envelope("auth.user_registered", {"userId": "u-42"})

        await handle_auth_events(envelope, db_session)

        db_session.add.assert_called_once()
        added = db_session.add.call_args[0][0]
        assert isinstance(added, Wallet)
        assert added.user_id == "u-42"
        db_session.commit.assert_called_once()

    @pytest.mark.asyncio
    async def test_unknown_event_does_nothing(self, db_session):
        envelope = make_envelope("auth.some_other_event", {"userId": "u-42"})

        await handle_auth_events(envelope, db_session)

        db_session.add.assert_not_called()
        db_session.commit.assert_not_called()
