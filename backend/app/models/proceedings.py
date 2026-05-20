from sqlalchemy import Boolean, Column, DateTime, ForeignKey, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base


class ProceedingsIssue(Base):
    __tablename__ = "proceedings_issues"
    __table_args__ = (UniqueConstraint("conference_id", name="uq_proceedings_issue_conference"),)

    id = Column(Integer, primary_key=True)
    conference_id = Column(Integer, ForeignKey("conferences.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    isbn = Column(String(100))
    doi_prefix = Column(String(100))
    is_published = Column(Boolean, default=False)
    published_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    conference = relationship("Conference", back_populates="proceedings_issues")
    entries = relationship(
        "ProceedingsEntry",
        back_populates="issue",
        cascade="all, delete-orphan",
        order_by="ProceedingsEntry.order",
    )


class ProceedingsEntry(Base):
    __tablename__ = "proceedings_entries"
    __table_args__ = (UniqueConstraint("issue_id", "paper_id", name="uq_proceedings_entry_paper"),)

    id = Column(Integer, primary_key=True)
    issue_id = Column(Integer, ForeignKey("proceedings_issues.id", ondelete="CASCADE"), nullable=False)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)
    doi = Column(String(255))
    pages = Column(String(50))
    order = Column(Integer, default=0)
    published_title = Column(String(500))
    published_abstract = Column(Text)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    issue = relationship("ProceedingsIssue", back_populates="entries")
    paper = relationship("Paper", back_populates="proceedings_entries")

