from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Index, Integer, JSON, String
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base
from model_enums import RoleEnum


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    email = Column(String(255), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(String(255), nullable=False)
    affiliation = Column(String(500))
    orcid = Column(String(50))
    phone = Column(String(50))
    position = Column(String(255))
    country = Column(String(2))
    role = Column(Enum(RoleEnum), default=RoleEnum.USER)
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)
    notification_preferences = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    authored_papers = relationship("Paper", back_populates="author", foreign_keys="Paper.author_id")
    reviews = relationship("Review", back_populates="reviewer")
    organized_conferences = relationship("Conference", back_populates="organizer", foreign_keys="Conference.organizer_id")


class AdminAuditLog(Base):
    __tablename__ = "admin_audit_logs"
    __table_args__ = (
        Index("ix_admin_audit_logs_created_at", "created_at"),
        Index("ix_admin_audit_logs_entity_type", "entity_type"),
        Index("ix_admin_audit_logs_actor_id", "actor_id"),
    )

    id = Column(Integer, primary_key=True)
    actor_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    action = Column(String(100), nullable=False)
    entity_type = Column(String(50), nullable=False)
    entity_id = Column(Integer, nullable=False)
    before = Column(JSON, default=dict)
    after = Column(JSON, default=dict)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    actor = relationship("User")

