from app.ai.schema_loader import load_schema
from app.ai.prompt import RULES
from app.ai.catalyst_client import ask_llm


def generate_sql(question: str, history: list = None):

    schema = load_schema()

    history_block = ""
    if history:
        turns = "\n".join(
            f"{h.get('role', 'user')}: {h.get('content', '')}" for h in history
        )
        history_block = f"\nConversation so far (for context/follow-ups):\n{turns}\n"

    prompt = f"""
{RULES}

Database Schema:

{schema}
{history_block}
User Question:
{question}

Generate ONLY PostgreSQL SQL.
"""

    return ask_llm(prompt).strip()