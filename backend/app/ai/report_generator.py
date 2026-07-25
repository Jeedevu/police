from app.ai.planner import plan
from app.ai.tool_router import route
from app.ai.reasoning import reason
from app.ai.spelling import correct_spelling
from app.database.connection import SessionLocal
from app.utils.logger import logger


def generate_investigation_report(question: str, history: list[dict] = None) -> dict:
    try:
        corrected_q = correct_spelling(question)

        tool_calls = plan(corrected_q)

        if not tool_calls:
            return {
                "success": True,
                "question": question,
                "corrected_question": corrected_q,
                "tool_calls": [],
                "tool_results": [],
                "summary": "Could not determine which investigation tools to use for this query. Try rephrasing or being more specific.",
                "findings": [],
                "recommendations": ["Specify a crime type, person name, or case identifier in your query."],
                "confidence_score": 50,
                "agent_version": "2.0",
            }

        db = SessionLocal()
        try:
            tool_results = route(tool_calls, db)
        finally:
            db.close()

        reasoning_result = reason(corrected_q, tool_results)

        report = {
            "success": True,
            "question": question,
            "corrected_question": corrected_q,
            "tool_calls": tool_calls,
            "tool_results": tool_results,
            "summary": reasoning_result.get("summary", ""),
            "findings": reasoning_result.get("findings", []),
            "recommendations": reasoning_result.get("recommendations", []),
            "confidence_score": reasoning_result.get("confidence_score", 70),
            "agent_version": "2.0",
        }

        logger.info(f"Investigation report generated for: {question[:80]}")
        return report

    except Exception as e:
        logger.error(f"Report generation failed: {e}")
        return {
            "success": False,
            "question": question,
            "error": f"Investigation engine error: {str(e)}",
            "agent_version": "2.0",
        }


def format_report_for_frontend(report: dict) -> dict:
    if not report.get("success"):
        return report

    flat_results = []
    for tr in report.get("tool_results", []):
        if tr.get("success") and tr.get("data"):
            for row in tr["data"]:
                flat_results.append(row)

    return {
        "success": report["success"],
        "question": report["question"],
        "corrected_question": report.get("corrected_question"),
        "summary": report.get("summary", ""),
        "findings": report.get("findings", []),
        "recommendations": report.get("recommendations", []),
        "confidence_score": report.get("confidence_score", 70),
        "rows_returned": len(flat_results),
        "data": flat_results,
        "tools_used": [
            {
                "tool": tc.get("tool"),
                "arguments": tc.get("arguments", {}),
            }
            for tc in report.get("tool_calls", [])
        ],
        "agent_version": report.get("agent_version", "2.0"),
    }
