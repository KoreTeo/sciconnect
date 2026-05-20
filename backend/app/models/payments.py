from sqlalchemy import Column, DateTime, Enum, ForeignKey, Index, Integer, Numeric, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base
from model_enums import PaymentStatusEnum


class Payment(Base):
    __tablename__ = "payments"
    __table_args__ = (
        Index("ix_payments_provider_external_id", "provider", "external_id"),
    )

    id = Column(Integer, primary_key=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    conference_id = Column(Integer, ForeignKey("conferences.id"), nullable=False)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=True)
    registration_id = Column(Integer, ForeignKey("conference_registrations.id"), nullable=True)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(String(3), default="RUB")
    status = Column(Enum(PaymentStatusEnum), default=PaymentStatusEnum.PENDING)
    provider = Column(String(50), default="demo")
    external_id = Column(String(255))
    purpose = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    paid_at = Column(DateTime(timezone=True))

    user = relationship("User")
    conference = relationship("Conference")

