from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Index, Integer, JSON, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base
from model_enums import PaperStatusEnum


class Paper(Base):
    __tablename__ = "papers"
    __table_args__ = (
        Index("ix_papers_author_id_id", "author_id", "id"),
        Index("ix_papers_conference_id_status", "conference_id", "status"),
        Index("ix_papers_conference_id_id", "conference_id", "id"),
    )

    id = Column(Integer, primary_key=True)
    conference_id = Column(Integer, ForeignKey("conferences.id"), nullable=False)
    author_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    track_id = Column(Integer, ForeignKey("conference_tracks.id"), nullable=True)
    title = Column(String(500), nullable=False)
    abstract = Column(Text, nullable=False)
    keywords = Column(JSON, default=list)
    file_url = Column(String(1000))
    file_name = Column(String(255))
    status = Column(Enum(PaperStatusEnum), default=PaperStatusEnum.DRAFT)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    conference = relationship("Conference", back_populates="papers")
    author = relationship("User", back_populates="authored_papers", foreign_keys=[author_id])
    track = relationship("ConferenceTrack", back_populates="papers")
    reviews = relationship("Review", back_populates="paper")
    co_authors = relationship("PaperAuthor", back_populates="paper", cascade="all, delete-orphan")
    proceedings_entries = relationship("ProceedingsEntry", back_populates="paper")
    versions = relationship("PaperVersion", back_populates="paper", cascade="all, delete-orphan", order_by="PaperVersion.version_number")
    revision_requests = relationship(
        "PaperRevisionRequest",
        back_populates="paper",
        cascade="all, delete-orphan",
        order_by="PaperRevisionRequest.round_number",
    )


class PaperVersion(Base):
    __tablename__ = "paper_versions"
    __table_args__ = (
        UniqueConstraint("paper_id", "version_number", name="uq_paper_version_number"),
        Index("ix_paper_versions_paper_id_version_number", "paper_id", "version_number"),
    )

    id = Column(Integer, primary_key=True)
    paper_id = Column(Integer, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    version_number = Column(Integer, nullable=False)
    file_url = Column(String(1000))
    file_name = Column(String(255))
    title = Column(String(500), nullable=False)
    abstract = Column(Text, nullable=False)
    keywords = Column(JSON, default=list)
    submitted_at = Column(DateTime(timezone=True), nullable=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    paper = relationship("Paper", back_populates="versions")
    creator = relationship("User")


class PaperRevisionRequest(Base):
    __tablename__ = "paper_revision_requests"
    __table_args__ = (
        Index("ix_paper_revision_requests_lookup", "paper_id", "resolved_at", "round_number"),
    )

    id = Column(Integer, primary_key=True)
    paper_id = Column(Integer, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    requested_by = Column(Integer, ForeignKey("users.id"), nullable=False)
    comment = Column(Text, nullable=False)
    round_number = Column(Integer, nullable=False)
    resolved_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    paper = relationship("Paper", back_populates="revision_requests")
    requester = relationship("User")


class PaperAuthor(Base):
    __tablename__ = "paper_authors"

    id = Column(Integer, primary_key=True)
    paper_id = Column(Integer, ForeignKey("papers.id", ondelete="CASCADE"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    full_name = Column(String(255), nullable=False)
    affiliation = Column(String(500))
    orcid = Column(String(50))
    order = Column(Integer, default=0)
    is_corresponding = Column(Boolean, default=False)

    paper = relationship("Paper", back_populates="co_authors")
    user = relationship("User")

