"""
Database migration script to create AI conversation persistence tables in PostgreSQL.
"""
import sys
import os
import logging

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.database.connection import engine, Base
from app.auth.models import Officer  # noqa
from app.models.case import Case  # noqa
from app.models.ai_conversation import AIConversation, AIConversationMessage  # noqa

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def create_tables():
    logger.info("Creating AI conversation persistence tables in PostgreSQL...")
    Base.metadata.create_all(bind=engine)
    logger.info("AI conversation persistence tables created successfully!")

if __name__ == "__main__":
    create_tables()
