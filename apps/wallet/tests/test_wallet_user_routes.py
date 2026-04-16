from datetime import datetime
from types import SimpleNamespace
from unittest.mock import AsyncMock, MagicMock

from wallet.models.balance_history import BalanceHistory
from wallet.models.wallet import WalletStatus


def make_wallet(id="w-1", user_id="u-1", balance=10000, currency="USD"):
    return SimpleNamespace(
        id=id,
        user_id=user_id,
        balance=balance,
        currency=currency,
        status=WalletStatus.ACTIVE,
    )


def make_history_entry(id="h-1", delta=-500, balance_after=9500, transaction_id="tx-1"):
    h = MagicMock(spec=BalanceHistory)
    h.id = id
    h.delta = delta
    h.balance_after = balance_after
    h.transaction_id = transaction_id
    h.created_at = datetime(2025, 1, 1, 0, 0, 0)
    return h


def setup_execute(session, *scalar_values):
    results = []
    for val in scalar_values:
        if isinstance(val, list):
            r = MagicMock()
            r.scalars.return_value.all.return_value = val
            results.append(r)
        else:
            r = MagicMock()
            r.scalar_one_or_none.return_value = val
            results.append(r)
    session.execute = AsyncMock(side_effect=results)


class TestGetWallet:
    def test_returns_wallet(self, user_client, session):
        wallet = make_wallet()
        setup_execute(session, wallet)

        resp = user_client.get("/api/v1/wallet/")

        assert resp.status_code == 200

    def test_wallet_not_found(self, user_client, session):
        setup_execute(session, None)

        resp = user_client.get("/api/v1/wallet/")

        assert resp.status_code == 404
        assert resp.json()["detail"] == "Wallet not found"


class TestGetWalletHistory:
    def test_returns_history(self, user_client, session):
        wallet = make_wallet()
        history = [make_history_entry()]
        setup_execute(session, wallet, history)

        resp = user_client.get("/api/v1/wallet/history")

        assert resp.status_code == 200
        body = resp.json()
        assert body["walletId"] == "w-1"
        assert len(body["history"]) == 1
        assert body["history"][0]["delta"] == -500
        assert body["history"][0]["balanceAfter"] == 9500
        assert body["history"][0]["transactionId"] == "tx-1"

    def test_returns_empty_history(self, user_client, session):
        wallet = make_wallet()
        setup_execute(session, wallet, [])

        resp = user_client.get("/api/v1/wallet/history")

        assert resp.status_code == 200
        assert resp.json()["history"] == []

    def test_wallet_not_found(self, user_client, session):
        setup_execute(session, None)

        resp = user_client.get("/api/v1/wallet/history")

        assert resp.status_code == 404
        assert resp.json()["detail"] == "Wallet not found"
