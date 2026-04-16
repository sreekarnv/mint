from unittest.mock import AsyncMock, MagicMock


def make_session_mock():
    session = MagicMock()
    session.execute = AsyncMock()
    session.flush = AsyncMock()
    session.commit = AsyncMock()
    session.add = MagicMock()

    cm = MagicMock()
    cm.__aenter__ = AsyncMock(return_value=session)
    cm.__aexit__ = AsyncMock(return_value=False)
    session.begin.return_value = cm
    return session


def make_get_db(session):
    async def _get_db():
        yield session

    return _get_db
