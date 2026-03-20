from datetime import datetime
from enum import StrEnum

from sqlalchemy import BIGINT, VARCHAR, String, func
from sqlalchemy.dialects.postgresql import TIMESTAMP
from sqlalchemy.orm import Mapped, mapped_column

from wallet.models.base import Base
from wallet.utils.generate_id import generate_id


class WalletStatus(StrEnum):
    ACTIVE = "active"
    FROZEN = "frozen"
    CLOSED = "closed"


class Wallet(Base):
    __tablename__ = "wallets"

    id: Mapped[str] = mapped_column(String, primary_key=True, insert_default=generate_id)
    user_id: Mapped[str] = mapped_column(String, unique=True, nullable=False)
    balance: Mapped[int] = mapped_column(BIGINT, nullable=False, default=0)
    currency: Mapped[str] = mapped_column(VARCHAR(3), nullable=False, default="USD")
    # TODO: later to use Postgres Enum
    status: Mapped[WalletStatus] = mapped_column(
        VARCHAR, default=WalletStatus.ACTIVE, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        TIMESTAMP(timezone=True), server_default=func.now(), server_onupdate=func.now()
    )
