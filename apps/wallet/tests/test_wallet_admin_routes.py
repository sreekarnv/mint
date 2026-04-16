from unittest.mock import AsyncMock, MagicMock
from wallet.models.wallet import Wallet, WalletStatus


def make_wallet(id="w-1", user_id="u-1", status=WalletStatus.ACTIVE):
    w = MagicMock(spec=Wallet)
    w.id = id
    w.user_id = user_id
    w.status = status
    return w


def setup_execute(session, scalar_value):
    result = MagicMock()
    result.scalar_one_or_none.return_value = scalar_value
    session.execute = AsyncMock(return_value=result)


class TestFreezeWallet:
    def test_freezes_active_wallet(self, admin_client, session):
        wallet = make_wallet(status=WalletStatus.ACTIVE)
        setup_execute(session, wallet)
        session.commit = AsyncMock()

        resp = admin_client.post("/api/v1/wallet/freeze?user_id=u-1")

        assert resp.status_code == 200
        assert resp.json()["walletId"] == "w-1"
        assert wallet.status == WalletStatus.FROZEN

    def test_wallet_not_found(self, admin_client, session):
        setup_execute(session, None)

        resp = admin_client.post("/api/v1/wallet/freeze?user_id=u-99")

        assert resp.status_code == 404
        assert resp.json()["detail"] == "Wallet not found"

    def test_already_frozen(self, admin_client, session):
        wallet = make_wallet(status=WalletStatus.FROZEN)
        setup_execute(session, wallet)

        resp = admin_client.post("/api/v1/wallet/freeze?user_id=u-1")

        assert resp.status_code == 400
        assert resp.json()["detail"] == "Already frozen"


class TestUnfreezeWallet:
    def test_unfreezes_frozen_wallet(self, admin_client, session):
        wallet = make_wallet(status=WalletStatus.FROZEN)
        setup_execute(session, wallet)
        session.commit = AsyncMock()

        resp = admin_client.post("/api/v1/wallet/unfreeze?user_id=u-1")

        assert resp.status_code == 200
        assert resp.json()["walletId"] == "w-1"
        assert wallet.status == WalletStatus.ACTIVE

    def test_wallet_not_found(self, admin_client, session):
        setup_execute(session, None)

        resp = admin_client.post("/api/v1/wallet/unfreeze?user_id=u-99")

        assert resp.status_code == 404
        assert resp.json()["detail"] == "Wallet not found"

    def test_not_frozen(self, admin_client, session):
        wallet = make_wallet(status=WalletStatus.ACTIVE)
        setup_execute(session, wallet)

        resp = admin_client.post("/api/v1/wallet/unfreeze?user_id=u-1")

        assert resp.status_code == 400
        assert resp.json()["detail"] == "Wallet is not frozen"
