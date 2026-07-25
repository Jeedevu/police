"""
SQLAlchemy models for AI Conversation Persistence in PostgreSQL.
"""
from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, JSON
from sqlalchemy.orm import relationship

from app.database.connection import Base


class AIConversation(Base):
    """
    Stores multi-turn AI chat sessions for officers.
    """
    __tablename__ = "ai_conversations"

    conversation_id = Column(String(100), primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("officers.id", ondelete="CASCADE"), nullable=False, index=True)
    case_id = Column(Integer, ForeignKey("casemaster.case_id", ondelete="SET NULL"), nullable=True, index=True)
    title = Column(String(255), nullable=False, default="New Conversation")
    language = Column(String(20), nullable=False, default="kn-IN")
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)

    # Relationships
    messages = relationship(
        "AIConversationMessage",
        back_populates="conversation",
        cascade="all, delete-orphan",
        order_by="AIConversationMessage.created_at",
    )


class AIConversationMessage(Base):
    """
    Stores individual messages within an AI conversation session.
    """
    __tablename__ = "ai_conversation_messages"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    conversation_id = Column(String(100), ForeignKey("ai_conversations.conversation_id", ondelete="CASCADE"), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # "user" | "assistant"
    message = Column(Text, nullable=False)
    translated_message = Column(Text, nullable=True)
    audio_url = Column(Text, nullable=True)
    evidence_json = Column(JSON, nullable=True)  # List of linked evidence/FIR assets
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)

    # Relationships
    conversation = relationship("AIConversation", back_populates="messages")
