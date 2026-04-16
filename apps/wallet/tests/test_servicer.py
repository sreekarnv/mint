import grpc
import pytest

from unittest.mock import AsyncMock, MagicMock

from wallet.grpc.servicer import WalletServicer
from wallet.models.balance_history import BalanceHistory
from wallet.models.wallet import Wallet, WalletStatus

from helpers import make_get_db, make_session_mock


def make_wallet(
    id="w-1",
    user_id="u-1",
    balance=10000,
    currency="USD",
    status=WalletStatus.ACTIVE,
):
    w = MagicMock(spec=Wallet)
    w.id = id
    w.user_id = user_id
    w.balance = balance
    w.currency = currency
    w.status = status
    return w


def make_history(wallet_id="w-1", transaction_id="tx-1", balance_after=9000):
    h = MagicMock(spec=BalanceHistory)
    h.wallet_id = wallet_id
    h.transaction_id = transaction_id
    h.balance_after = balance_after
    return h


def make_request(**kwargs):
    req = MagicMock()
    req.wallet_id = kwargs.get("wallet_id", "w-1")
    req.user_id = kwargs.get("user_id", "u-1")
    req.transaction_id = kwargs.get("transaction_id", "tx-1")
    req.amount_cents = kwargs.get("amount_cents", 1000)
    return req


@pytest.fixture
def context():
    ctx = AsyncMock()
    return ctx


@pytest.fixture
def session():
    return make_session_mock()


@pytest.fixture
def servicer(session):
    return WalletServicer(make_get_db(session))


def setup_execute(session, *scalar_values):
    results = []
    for val in scalar_values:
        r = MagicMock()
        r.scalar_one_or_none.return_value = val
        results.append(r)
    session.execute = AsyncMock(side_effect=results)


class TestDebitWallet:
    @pytest.mark.asyncio
    async def test_happy_path(self, servicer, session, context):
        wallet = make_wallet(balance=10000)
        setup_execute(session, wallet, None)

        req = make_request(amount_cents=1000)
        resp = await servicer.DebitWallet(req, context)

        assert resp.success is True
        assert resp.balance_after == 9000
        context.abort.assert_not_called()

    @pytest.mark.asyncio
    async def test_wallet_not_found(self, servicer, session, context):
        setup_execute(session, None)

        req = make_request()
        resp = await servicer.DebitWallet(req, context)

        context.abort.assert_called_once()
        assert context.abort.call_args[0][0] == grpc.StatusCode.NOT_FOUND
        assert resp.success is False

    @pytest.mark.asyncio
    async def test_frozen_wallet(self, servicer, session, context):
        wallet = make_wallet(status=WalletStatus.FROZEN)
        setup_execute(session, wallet)

        req = make_request()
        resp = await servicer.DebitWallet(req, context)

        context.abort.assert_called_once()
        assert context.abort.call_args[0][0] == grpc.StatusCode.FAILED_PRECONDITION
        assert resp.success is False

    @pytest.mark.asyncio
    async def test_insufficient_funds(self, servicer, session, context):
        wallet = make_wallet(balance=500)
        setup_execute(session, wallet, None)

        req = make_request(amount_cents=1000)
        resp = await servicer.DebitWallet(req, context)

        context.abort.assert_called_once()
        assert context.abort.call_args[0][0] == grpc.StatusCode.FAILED_PRECONDITION
        assert "Insufficient" in resp.error

    @pytest.mark.asyncio
    async def test_idempotent_debit(self, servicer, session, context):
        wallet = make_wallet(balance=10000)
        existing = make_history(balance_after=9000)
        setup_execute(session, wallet, existing)

        req = make_request(amount_cents=1000)
        resp = await servicer.DebitWallet(req, context)

        assert resp.success is True
        assert resp.balance_after == 9000
        session.add.assert_not_called()


class TestCreditWallet:
    @pytest.mark.asyncio
    async def test_happy_path(self, servicer, session, context):
        wallet = make_wallet(balance=5000)
        setup_execute(session, wallet, None)

        req = make_request(amount_cents=2000)
        resp = await servicer.CreditWallet(req, context)

        assert resp.success is True
        assert resp.balance_after == 7000
        context.abort.assert_not_called()

    @pytest.mark.asyncio
    async def test_wallet_not_found(self, servicer, session, context):
        setup_execute(session, None)

        req = make_request()
        resp = await servicer.CreditWallet(req, context)

        context.abort.assert_called_once()
        assert context.abort.call_args[0][0] == grpc.StatusCode.NOT_FOUND
        assert resp.success is False

    @pytest.mark.asyncio
    async def test_frozen_wallet(self, servicer, session, context):
        wallet = make_wallet(status=WalletStatus.FROZEN)
        setup_execute(session, wallet)

        req = make_request()
        resp = await servicer.CreditWallet(req, context)

        context.abort.assert_called_once()
        assert context.abort.call_args[0][0] == grpc.StatusCode.FAILED_PRECONDITION

    @pytest.mark.asyncio
    async def test_idempotent_credit(self, servicer, session, context):
        wallet = make_wallet(balance=5000)
        existing = make_history(balance_after=7000)
        setup_execute(session, wallet, existing)

        req = make_request(amount_cents=2000)
        resp = await servicer.CreditWallet(req, context)

        assert resp.success is True
        assert resp.balance_after == 7000
        session.add.assert_not_called()


class TestGetBalance:
    @pytest.mark.asyncio
    async def test_returns_balance(self, servicer, session, context):
        wallet = make_wallet(balance=12345, currency="EUR")
        setup_execute(session, wallet)

        req = make_request()
        resp = await servicer.GetBalance(req, context)

        assert resp.balance == 12345
        assert resp.currency == "EUR"

    @pytest.mark.asyncio
    async def test_wallet_not_found(self, servicer, session, context):
        setup_execute(session, None)

        req = make_request()
        await servicer.GetBalance(req, context)

        context.abort.assert_called_once()
        assert context.abort.call_args[0][0] == grpc.StatusCode.NOT_FOUND


class TestFreezeWallet:
    @pytest.mark.asyncio
    async def test_freezes_wallet(self, servicer, session, context):
        result = MagicMock()
        result.rowcount = 1
        session.execute = AsyncMock(return_value=result)

        req = make_request()
        resp = await servicer.FreezeWallet(req, context)

        assert resp.success is True
        assert "frozen" in resp.message.lower()

    @pytest.mark.asyncio
    async def test_wallet_not_found(self, servicer, session, context):
        result = MagicMock()
        result.rowcount = 0
        session.execute = AsyncMock(return_value=result)

        req = make_request()
        resp = await servicer.FreezeWallet(req, context)

        context.abort.assert_called_once()
        assert context.abort.call_args[0][0] == grpc.StatusCode.NOT_FOUND
        assert resp.success is False


class TestUnfreezeWallet:
    @pytest.mark.asyncio
    async def test_unfreezes_wallet(self, servicer, session, context):
        result = MagicMock()
        result.rowcount = 1
        session.execute = AsyncMock(return_value=result)

        req = make_request()
        resp = await servicer.UnfreezeWallet(req, context)

        assert resp.success is True
        assert "unfrozen" in resp.message.lower()

    @pytest.mark.asyncio
    async def test_wallet_not_found(self, servicer, session, context):
        result = MagicMock()
        result.rowcount = 0
        session.execute = AsyncMock(return_value=result)

        req = make_request()
        resp = await servicer.UnfreezeWallet(req, context)

        context.abort.assert_called_once()
        assert context.abort.call_args[0][0] == grpc.StatusCode.NOT_FOUND


class TestGetWallet:
    @pytest.mark.asyncio
    async def test_returns_wallet(self, servicer, session, context):
        wallet = make_wallet(id="w-1", user_id="u-1", balance=5000, currency="USD")
        wallet.is_default = True
        setup_execute(session, wallet)

        req = make_request(user_id="u-1")
        resp = await servicer.GetWallet(req, context)

        assert resp.id == "w-1"
        assert resp.user_id == "u-1"
        assert resp.balance == 5000
        assert resp.currency == "USD"
        assert resp.is_default is True

    @pytest.mark.asyncio
    async def test_wallet_not_found(self, servicer, session, context):
        setup_execute(session, None)

        req = make_request(user_id="u-99")
        await servicer.GetWallet(req, context)

        context.abort.assert_called_once()
        assert context.abort.call_args[0][0] == grpc.StatusCode.NOT_FOUND
