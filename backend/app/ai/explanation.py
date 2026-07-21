from app.ai.prompt import SYSTEM_EXPLAIN_PROMPT
from app.ai.catalyst_client import ask_llm


def explain(question, sql, rows):

    prompt = f"""
Officer Question

{question}

SQL

{sql}

Database Result

{rows}

Explain professionally.
"""

    return ask_llm(
        SYSTEM_EXPLAIN_PROMPT,
        prompt
    )