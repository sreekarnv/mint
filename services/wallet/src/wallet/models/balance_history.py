from datetime import datetime

from sqlalchemy import BIGINT, DATETIME, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column

from wallet.models.base import Base
from wallet.utils.generate_id import generate_id


class BalanceHistory(Base):
    __tablename__ = "balance_history"

    id: Mapped[str] = mapped_column(
        String, primary_key=True, insert_default=generate_id
    )
    wallet_id: Mapped[str] = mapped_column(
        String, ForeignKey("wallets.id"), nullable=False
    )
    transaction_id: Mapped[str] = mapped_column(String, nullable=False)
    delta: Mapped[int] = mapped_column(BIGINT, nullable=False)
    balance_after: Mapped[int] = mapped_column(BIGINT, nullable=False)

    created_at: Mapped[datetime] = mapped_column(
        DATETIME(timezone=True), server_default=func.now()
    )
