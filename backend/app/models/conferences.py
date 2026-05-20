from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Enum,
    ForeignKey,
    Index,
    Integer,
    JSON,
    Numeric,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base
from model_enums import (
    ConferenceRoleEnum,
    ConferenceStatusEnum,
    FormatEnum,
    RegistrationStatusEnum,
    RegistrationTypeEnum,
    ReviewModeEnum,
)


class Conference(Base):
    __tablename__ = "conferences"
    __table_args__ = (
        Index("ix_conferences_status_start_date", "status", "start_date"),
        Index("ix_conferences_organizer_id", "organizer_id"),
    )

    id = Column(Integer, primary_key=True)
    organizer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String(500), nullable=False)
    short_name = Column(String(50), unique=True)
    description = Column(Text)
    topics = Column(JSON, default=list)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=False)
    submission_deadline = Column(DateTime(timezone=True), nullable=False)
    review_deadline = Column(DateTime(timezone=True), nullable=False)
    location = Column(String(500))
    format = Column(Enum(FormatEnum), default=FormatEnum.OFFLINE)
    status = Column(Enum(ConferenceStatusEnum), default=ConferenceStatusEnum.DRAFT)
    registration_fee = Column(Numeric(10, 2), default=0)
    submission_fee = Column(Numeric(10, 2), default=0)
    fee_required = Column(Boolean, default=False)
    early_bird_fee = Column(Numeric(10, 2))
    early_bird_deadline = Column(DateTime(timezone=True))
    review_mode = Column(String(20), default=ReviewModeEnum.OPEN.value)
    moderation_comment = Column(Text)
    moderated_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    moderated_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    organizer = relationship("User", back_populates="organized_conferences", foreign_keys=[organizer_id])
    moderator = relationship("User", foreign_keys=[moderated_by])
    papers = relationship("Paper", back_populates="conference")
    program_sessions = relationship("ProgramSession", back_populates="conference")
    site = relationship("ConferenceSite", back_populates="conference", uselist=False)
    conference_reviewers = relationship("ConferenceReviewer", back_populates="conference")
    proceedings_issues = relationship("ProceedingsIssue", back_populates="conference")
    tracks = relationship("ConferenceTrack", back_populates="conference", cascade="all, delete-orphan")
    promo_codes = relationship("ConferencePromoCode", back_populates="conference", cascade="all, delete-orphan")
    roles = relationship("ConferenceRole", back_populates="conference", cascade="all, delete-orphan")


class ConferenceReviewer(Base):
    __tablename__ = "conference_reviewers"
    __table_args__ = (UniqueConstraint("conference_id", "user_id", name="uq_conference_reviewer"),)

    id = Column(Integer, primary_key=True)
    conference_id = Column(Integer, ForeignKey("conferences.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    conference = relationship("Conference", back_populates="conference_reviewers")
    user = relationship("User")


class ConferenceSite(Base):
    __tablename__ = "conference_sites"

    id = Column(Integer, primary_key=True)
    conference_id = Column(Integer, ForeignKey("conferences.id"), unique=True, nullable=False)
    theme_json = Column(JSON, default=dict)
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime(timezone=True))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    conference = relationship("Conference", back_populates="site")


class ConferenceRegistration(Base):
    __tablename__ = "conference_registrations"
    __table_args__ = (UniqueConstraint("conference_id", "user_id", name="uq_conference_registration"),)

    id = Column(Integer, primary_key=True)
    conference_id = Column(Integer, ForeignKey("conferences.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    registration_type = Column(Enum(RegistrationTypeEnum), default=RegistrationTypeEnum.LISTENER)
    status = Column(Enum(RegistrationStatusEnum), default=RegistrationStatusEnum.CONFIRMED)
    registered_at = Column(DateTime(timezone=True), server_default=func.now())

    conference = relationship("Conference")
    user = relationship("User")


class ConferencePromoCode(Base):
    __tablename__ = "conference_promo_codes"
    __table_args__ = (UniqueConstraint("conference_id", "code", name="uq_conference_promo_code"),)

    id = Column(Integer, primary_key=True)
    conference_id = Column(Integer, ForeignKey("conferences.id", ondelete="CASCADE"), nullable=False)
    code = Column(String(50), nullable=False)
    discount_percent = Column(Numeric(5, 2), default=0)
    discount_fixed = Column(Numeric(10, 2), default=0)
    max_uses = Column(Integer)
    used_count = Column(Integer, default=0)
    expires_at = Column(DateTime(timezone=True))
    is_active = Column(Boolean, default=True)

    conference = relationship("Conference", back_populates="promo_codes")


class ConferenceTrack(Base):
    __tablename__ = "conference_tracks"
    __table_args__ = (UniqueConstraint("conference_id", "slug", name="uq_conference_track_slug"),)

    id = Column(Integer, primary_key=True)
    conference_id = Column(Integer, ForeignKey("conferences.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    slug = Column(String(80), nullable=False)
    description = Column(Text)

    conference = relationship("Conference", back_populates="tracks")
    papers = relationship("Paper", back_populates="track")


class ConferenceRole(Base):
    __tablename__ = "conference_roles"
    __table_args__ = (
        UniqueConstraint("conference_id", "user_id", "role", "track_id", name="uq_conference_role"),
    )

    id = Column(Integer, primary_key=True)
    conference_id = Column(Integer, ForeignKey("conferences.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    role = Column(String(30), nullable=False)
    track_id = Column(Integer, ForeignKey("conference_tracks.id"), nullable=True)

    conference = relationship("Conference", back_populates="roles")
    user = relationship("User")
    track = relationship("ConferenceTrack")

