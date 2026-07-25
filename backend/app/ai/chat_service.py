"""
Chat service — implements the new AI pipeline:

User Question
    ↓
Intent Detection (Gemini)
    ↓
SQL Generation (Gemini)
    ↓
Execute SQL (SQLAlchemy — Gemini never touches DB directly)
    ↓
Retrieve rows
    ↓
Gemini formats answer
    ↓
Return JSON

Gemini responsibilities:
  - Natural language understanding
  - Intent detection
  - SQL generation
  - Response formatting
  - Conversation continuity
  - Case summarisation
  - Evidence explanation
  - Investigation assistance

NOT responsible for: database access, SQL execution
"""
import json
import logging
import re
from typing import Optional, AsyncIterator

from app.ai.conversation_store import append_turn, get_history
from app.ai.schema_loader import load_schema
from app.ai.sql_validator import validate_sql
from app.database.connection import SessionLocal
from app.utils.logger import logger as app_logger

logger = logging.getLogger(__name__)


INTENT_DETECTION_SYSTEM = """You are an expert police intelligence analyst for Karnataka State Police.
Your task is to detect the intent of an officer's question and determine the best query strategy.

Classify the intent as one of:
- sql_query: officer wants to search/retrieve database records
- summary: officer wants a summary or report of a case/person
- analysis: officer wants patterns, trends, statistics
- conversation: casual question, greeting, help request
- investigation: officer wants investigative guidance on a specific case

Respond with ONLY a JSON object:
{"intent": "<type>", "confidence": <0-100>, "entities": {"crime_type": "...", "district": "...", "person_name": "...", ...}}
"""

SQL_GENERATION_SYSTEM = """You are an expert PostgreSQL SQL generator for Karnataka Police Crime Database.

Rules:
1. Generate ONLY PostgreSQL SELECT queries — never INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE.
2. Use ILIKE for text matching (case-insensitive).
3. Add LIMIT 100 unless the user asks for more.
4. Use only the tables and columns from the provided schema.
5. Handle spelling mistakes and Kannada transliterations gracefully.
6. Return ONLY the SQL query — no markdown, no explanation.

Crime type mappings:
- thrift/theif/stealing → Theft
- murdur/muder/kole/killing → Murder
- robery/darode → Robbery
- cyberattack/hacking → Cyber Crime
- vanchana/fraud → Fraud
- gunda/gang → Organized Crime
"""

RESPONSE_FORMATTING_SYSTEM = """You are an expert police investigation assistant for Karnataka State Police.
You analyze database query results and provide clear, actionable intelligence to investigating officers.

Format guidelines:
1. Detect the language of the officer's question. If Kannada, respond in Kannada. Otherwise in English.
2. Provide a clear summary of what was found.
3. Highlight key findings and patterns.
4. Give 2-4 tactical recommendations for the investigation.
5. Keep summaries concise (3-5 sentences).
6. Never fabricate information. If results are empty, state clearly.
7. Use markdown formatting for readability.
8. Cite actual data from the results (names, case numbers, locations).

Return a JSON response with:
{
  "summary": "...",
  "findings": ["...", "..."],
  "recommendations": ["...", "..."],
  "confidence_score": 85,
  "formatted_answer": "Full markdown-formatted answer for display"
}
"""


class ChatService:
    """
    Orchestrates the full AI → SQL → DB → AI pipeline.
    Each officer gets their own conversation session.
    """

    def __init__(self, session_key: str):
        self.session_key = session_key
        self._provider = None

    @property
    def provider(self):
        if self._provider is None:
            from app.core.provider_factory import get_ai_provider
            self._provider = get_ai_provider()
        return self._provider

    # ── Public API ─────────────────────────────────────────────────────────────

    async def chat(self, question: str, jurisdiction: dict = None) -> dict:
        """
        Full pipeline: question → intent → SQL → execute → format → response.
        """
        history = get_history(self.session_key)

        # Step 1: Detect intent
        intent_data = await self._detect_intent(question, history)
        intent = intent_data.get("intent", "sql_query")

        # Step 2: Handle based on intent
        if intent == "conversation":
            response = await self._handle_conversation(question, history)
        elif intent in ("sql_query", "analysis", "investigation", "summary"):
            response = await self._handle_data_query(question, history, jurisdiction, intent_data)
        else:
            response = await self._handle_conversation(question, history)

        # Step 3: Store in conversation history
        append_turn(self.session_key, "user", question)
        append_turn(self.session_key, "assistant", response.get("summary", ""), metadata={
            "intent": intent,
            "rows_returned": response.get("rows_returned", 0),
        })

        return response

    async def stream_chat(self, question: str, jurisdiction: dict = None) -> AsyncIterator[str]:
        """Streaming version — yields response chunks as they arrive from Gemini."""
        history = get_history(self.session_key)

        # Build streaming prompt
        prompt = self._build_chat_prompt(question, history)

        append_turn(self.session_key, "user", question)

        full_response = ""
        async for chunk in self.provider.stream(
            prompt=prompt,
            system_prompt=RESPONSE_FORMATTING_SYSTEM,
            temperature=0.4,
        ):
            full_response += chunk
            yield chunk

        append_turn(self.session_key, "assistant", full_response[:500])

    # ── Internal steps ─────────────────────────────────────────────────────────

    async def _detect_intent(self, question: str, history: list) -> dict:
        try:
            history_ctx = ""
            if history:
                recent = history[-4:]
                history_ctx = "\n".join(f"{h['role']}: {h['content'][:100]}" for h in recent)
                history_ctx = f"\nRecent conversation:\n{history_ctx}\n"

            prompt = f"{history_ctx}\nOfficer question: {question}"
            raw = await self.provider.ask_async(
                prompt=prompt,
                system_prompt=INTENT_DETECTION_SYSTEM,
                temperature=0.1,
                max_tokens=200,
            )
            # Extract JSON
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                return json.loads(match.group(0))
        except Exception as exc:
            logger.warning(f"Intent detection failed: {exc}")

        return {"intent": "sql_query", "confidence": 50, "entities": {}}

    async def _handle_data_query(
        self,
        question: str,
        history: list,
        jurisdiction: dict,
        intent_data: dict,
    ) -> dict:
        """Generate SQL → execute → format response."""
        from app.ai.spelling import correct_spelling
        from app.ai.query_executor import execute_sql

        corrected = correct_spelling(question)

        # Generate SQL
        sql = await self._generate_sql(corrected, history)
        if not sql:
            return await self._handle_conversation(question, history)

        # Validate (never allow destructive queries)
        is_valid, msg = validate_sql(sql)
        if not is_valid:
            logger.warning(f"SQL validation failed: {msg} | SQL: {sql[:100]}")
            return {
                "success": False,
                "summary": f"Generated query was invalid: {msg}",
                "generated_sql": sql,
                "data": [],
                "rows_returned": 0,
            }

        # Execute SQL via SQLAlchemy (Gemini never touches DB directly)
        try:
            rows = execute_sql(sql)
        except Exception as exc:
            logger.error(f"SQL execution error: {exc}")
            rows = []

        # Format response with Gemini
        formatted = await self._format_response(question, sql, rows)

        return {
            "success": True,
            "question": question,
            "corrected_question": corrected,
            "intent": intent_data.get("intent"),
            "generated_sql": sql,
            "rows_returned": len(rows),
            "data": rows,
            "summary": formatted.get("summary", ""),
            "findings": formatted.get("findings", []),
            "recommendations": formatted.get("recommendations", []),
            "confidence_score": formatted.get("confidence_score", 80),
            "formatted_answer": formatted.get("formatted_answer", ""),
        }

    async def _generate_sql(self, question: str, history: list) -> Optional[str]:
        """Ask Gemini to generate SQL from natural language."""
        try:
            schema = load_schema()
            history_block = ""
            if history:
                recent = history[-6:]
                turns = "\n".join(f"{h['role']}: {h['content'][:100]}" for h in recent)
                history_block = f"\nConversation context:\n{turns}\n"

            prompt = f"""Database Schema:
{schema}
{history_block}
Officer Question: {question}

Generate ONLY a PostgreSQL SELECT query. No markdown, no explanation."""

            raw = await self.provider.ask_async(
                prompt=prompt,
                system_prompt=SQL_GENERATION_SYSTEM,
                temperature=0.1,
                max_tokens=500,
            )

            # Clean markdown fences
            sql = raw.strip()
            if sql.startswith("```"):
                lines = sql.splitlines()
                sql = "\n".join(l for l in lines if not l.startswith("```"))
            if sql.endswith(";"):
                sql = sql[:-1]

            return sql.strip()

        except Exception as exc:
            logger.error(f"SQL generation failed: {exc}")
            # Fallback to direct keyword-based query when Gemini API is rate limited / unavailable
            return self._build_fallback_sql(question)

    def _build_fallback_sql(self, question: str) -> str:
        q = question.lower()
        keywords = ["murder", "theft", "robbery", "cyber", "fraud", "organized", "narcotics", "assault", "kidnapping"]
        found_type = next((k.capitalize() for k in keywords if k in q), None)
        if found_type:
            return f"SELECT * FROM casemaster WHERE crime_type ILIKE '%{found_type}%' ORDER BY case_id DESC LIMIT 50"
        
        words = [w for w in q.split() if len(w) > 3 and w not in ("show", "find", "list", "recent", "cases", "police", "district")]
        if words:
            term = words[0]
            return f"SELECT * FROM casemaster WHERE brief_facts ILIKE '%{term}%' OR district ILIKE '%{term}%' OR police_station ILIKE '%{term}%' ORDER BY case_id DESC LIMIT 50"
        
        return "SELECT * FROM casemaster ORDER BY case_id DESC LIMIT 20"

    async def _format_response(self, question: str, sql: str, rows: list) -> dict:
        """Ask Gemini to format the SQL results into a readable police intelligence report."""
        try:
            sample_rows = rows[:20] if rows else []
            prompt = f"""Officer Question: {question}
SQL Executed: {sql}
Results ({len(rows)} rows): {json.dumps(sample_rows, default=str)}

Analyze these results and provide a structured intelligence report."""

            raw = await self.provider.ask_async(
                prompt=prompt,
                system_prompt=RESPONSE_FORMATTING_SYSTEM,
                temperature=0.4,
                max_tokens=1000,
            )

            # Try to parse JSON
            match = re.search(r"\{.*\}", raw, re.DOTALL)
            if match:
                return json.loads(match.group(0))

            # Fallback: treat whole response as formatted_answer
            return {
                "summary": raw[:300],
                "findings": [],
                "recommendations": [],
                "confidence_score": 75,
                "formatted_answer": raw,
            }

        except Exception as exc:
            logger.error(f"Response formatting failed: {exc}")
            return {
                "summary": f"Retrieved {len(rows)} record(s) from the database.",
                "findings": [],
                "recommendations": [],
                "confidence_score": 70,
                "formatted_answer": f"Found {len(rows)} records matching your query.",
            }

    async def _handle_conversation(self, question: str, history: list) -> dict:
        """Handle conversational queries that don't need SQL."""
        try:
            history_block = ""
            if history:
                recent = history[-8:]
                history_block = "\n".join(
                    f"{h['role'].capitalize()}: {h['content'][:200]}" for h in recent
                )

            prompt = f"""{history_block}

Officer: {question}
Assistant:"""

            response = await self.provider.ask_async(
                prompt=prompt,
                system_prompt="""You are a helpful AI assistant for Karnataka State Police.
You assist police officers with investigation queries, case summaries, and procedural guidance.
Be professional, concise, and factual. Detect the language and respond accordingly.""",
                temperature=0.5,
                max_tokens=600,
            )

            return {
                "success": True,
                "question": question,
                "intent": "conversation",
                "summary": response,
                "findings": [],
                "recommendations": [],
                "confidence_score": 90,
                "data": [],
                "rows_returned": 0,
                "formatted_answer": response,
            }

        except Exception as exc:
            logger.error(f"Conversation handler failed: {exc}")
            return {
                "success": False,
                "summary": "I'm having trouble responding right now. Please try again.",
                "data": [],
                "rows_returned": 0,
            }

    def _build_chat_prompt(self, question: str, history: list) -> str:
        history_block = ""
        if history:
            recent = history[-6:]
            history_block = "\n".join(
                f"{h['role'].capitalize()}: {h['content'][:200]}" for h in recent
            )
        return f"""{history_block}

Officer: {question}
Assistant:"""
