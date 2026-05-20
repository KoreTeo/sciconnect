from sqlalchemy import Boolean, Column, DateTime, Enum, ForeignKey, Index, Integer, Text, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from database import Base
from model_enums import RecommendationEnum


class Review(Base):
    __tablename__ = "reviews"
    __table_args__ = (
        UniqueConstraint("paper_id", "reviewer_id", name="uq_paper_reviewer"),
        Index("ix_reviews_reviewer_id_submitted_at", "reviewer_id", "submitted_at"),
        Index("ix_reviews_paper_id", "paper_id"),
    )

    id = Column(Integer, primary_key=True)
    paper_id = Column(Integer, ForeignKey("papers.id"), nullable=False)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    score_relevance = Column(Integer)
    score_novelty = Column(Integer)
    score_clarity = Column(Integer)
    score_methodology = Column(Integer)
    comment_for_author = Column(Text)
    comment_for_chair = Column(Text)
    recommendation = Column(Enum(RecommendationEnum))
    conflict_declared = Column(Boolean, default=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    paper = relationship("Paper", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews")

