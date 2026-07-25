from app.ai.catalyst_client import ask_llm

def explain_results(question, data):
    prompt = f"""
Question:
{question}

Results:
{data}

Explain these investigation results clearly for a police officer.
"""

    return ask_llm(prompt)