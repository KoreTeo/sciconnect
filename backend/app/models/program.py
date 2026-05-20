from sqlalchemy import Column, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import relationship

from database import Base


class ProgramSession(Base):
    __tablename__ = "program_sessions"

    id = Column(Integer, primary_key=True)
    conference_id = Column(Integer, ForeignKey("conferences.id"), nullable=False)
    title = Column(String(500), nullable=False)
    description = Column(Text)
    start_time = Column(DateTime(timezone=True))
    end_time = Column(DateTime(timezone=True))
    room = Column(String(100))

    conference = relationship("Conference", back_populates="program_sessions")
    items = relationship("ProgramItem", back_populates="session")


class ProgramItem(Base):
    __tablename__ = "program_items"

    id = Column(Integer, primary_key=True)
    session_id = Column(Integer, ForeignKey("program_sessions.id"), nullable=False)
    paper_id = Column(Integer, ForeignKey("papers.id"))
    title = Column(String(500), nullable=False)
    authors = Column(Text)
    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)
    order = Column(Integer, default=0)

    session = relationship("ProgramSession", back_populates="items")

