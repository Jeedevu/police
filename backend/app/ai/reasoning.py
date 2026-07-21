import re
import json
from app.ai.catalyst_client import ask_llm
from app.utils.logger import logger


REASONING_SYSTEM_PROMPT = """You are an expert police investigation assistant and criminal analyst.
You analyze database results and provide actionable intelligence to investigating officers.

For each query, you must provide:
1. A clear summary of what was found (matching the language of the question - English or Kannada)
2. Key findings and patterns detected in the data
3. 2-4 tactical next-step recommendations for the investigation
4. A confidence score (0-100) based on data completeness and result relevance

Rules:
- If the question is in Kannada, respond in Kannada. Otherwise respond in English.
- Be specific and cite actual data from the results.
- Never fabricate information. If results are empty, state that clearly.
- Keep the summary concise (3-5 sentences).
- Recommendations must be actionable police procedures."""


def build_reasoning_prompt(question: str, tool_results: list[dict]) -> str:
    context_parts = []
    for tr in tool_results:
        if tr.get("success") and tr.get("data"):
            context_parts.append(
                f"Tool: {tr['tool']}\n"
                f"Arguments: {json.dumps(tr.get('arguments', {}), indent=2)}\n"
                f"Results ({tr.get('row_count', 0)} rows):\n"
                f"{json.dumps(tr['data'][:15], indent=2, default=str)}"
            )
        elif tr.get("success") and not tr.get("data"):
            context_parts.append(
                f"Tool: {tr['tool']}\n"
                f"Arguments: {json.dumps(tr.get('arguments', {}), indent=2)}\n"
                f"No matching records found."
            )
        else:
            context_parts.append(
                f"Tool: {tr['tool']}\n"
                f"Error: {tr.get('error', 'Unknown error')}"
            )

    context = "\n\n".join(context_parts)

    prompt = f"""{REASONING_SYSTEM_PROMPT}

Officer Question: {question}

Database Results:
{context}

Based on the above, provide:
1. Summary
2. Key Findings
3. Tactical Recommendations
4. Confidence Score (0-100)

Format your response exactly as:

---SUMMARY---
[Your summary here]

---FINDINGS---
- [Finding 1]
- [Finding 2]

---RECOMMENDATIONS---
- [Recommendation 1]
- [Recommendation 2]

---CONFIDENCE---
[Score number only]
"""
    return prompt


def reason(question: str, tool_results: list[dict]) -> dict:
    prompt = build_reasoning_prompt(question, tool_results)

    try:
        raw = ask_llm(prompt)
    except Exception as e:
        logger.error(f"Reasoning LLM call failed: {e}")
        return _fallback_reasoning(question, tool_results)

    summary = ""
    findings = []
    recommendations = []
    confidence = 70

    summary_match = re.search(r"---SUMMARY---\s*(.*?)(?=---FINDINGS---|\Z)", raw, re.DOTALL)
    if summary_match:
        summary = summary_match.group(1).strip()

    findings_match = re.search(r"---FINDINGS---\s*(.*?)(?=---RECOMMENDATIONS---|\Z)", raw, re.DOTALL)
    if findings_match:
        lines = findings_match.group(1).strip().splitlines()
        findings = [
            line.strip().lstrip("-* ").strip()
            for line in lines
            if line.strip() and not line.strip().startswith("---")
        ]

    recs_match = re.search(r"---RECOMMENDATIONS---\s*(.*?)(?=---CONFIDENCE---|\Z)", raw, re.DOTALL)
    if recs_match:
        lines = recs_match.group(1).strip().splitlines()
        recommendations = [
            line.strip().lstrip("-* ").strip()
            for line in lines
            if line.strip() and not line.strip().startswith("---")
        ]

    conf_match = re.search(r"---CONFIDENCE---\s*(\d+)", raw)
    if conf_match:
        confidence = int(conf_match.group(1))

    if not summary:
        summary = _generate_fallback_summary(tool_results)

    return {
        "summary": summary,
        "findings": findings,
        "recommendations": recommendations,
        "confidence_score": min(max(confidence, 0), 100),
    }


def _generate_fallback_summary(tool_results: list[dict]) -> str:
    total_rows = sum(tr.get("row_count", 0) for tr in tool_results if tr.get("success"))
    tools_used = [tr["tool"] for tr in tool_results if tr.get("success")]
    if total_rows == 0:
        return "The database query completed but returned no matching records. Consider broadening the search criteria."
    tools_str = ", ".join(tools_used)
    return f"Successfully retrieved {total_rows} records using {len(tools_used)} search tool(s): {tools_str}. Review the data table below for details."


def _fallback_reasoning(question: str, tool_results: list[dict]) -> dict:
    total_rows = sum(tr.get("row_count", 0) for tr in tool_results if tr.get("success"))
    has_kannada = bool(re.search(r'[\u0C80-\u0CFF]', question))

    if has_kannada:
        return {
            "summary": f"ದತ್ತಾಂಶ ವಿಶ್ಲೇಷಣೆ ಪೂರ್ಣಗೊಂಡಿದೆ. ಒಟ್ಟು {total_rows} ದಾಖಲೆಗಳು ಲಭ್ಯವಾಗಿವೆ. ಹೆಚ್ಚಿನ ವಿವರಗಳಿಗಾಗಿ ಕೆಳಗಿನ ಕೋಷ್ಟಕವನ್ನು ಪರಿಶೀಲಿಸಿ.",
            "findings": [f"ಒಟ್ಟು {total_rows} ದಾಖಲೆಗಳು ಪತ್ತೆಯಾಗಿವೆ."],
            "recommendations": [
                "ದಾಖಲೆಗಳ ಮುದ್ರಣ ಪಡೆದು ಪ್ರಕರಣದ ಫೈಲ್‌ಗೆ ಸೇರಿಸಿ.",
                "ಸಾಕ್ಷ್ಯಗಳ ಸತ್ಯಾಸತ್ಯತೆಯನ್ನು ಪರಿಶೀಲಿಸಿ."
            ],
            "confidence_score": 75,
        }

    return {
        "summary": f"Database analysis complete. Retrieved {total_rows} record(s). Review the data below for details.",
        "findings": [f"Retrieved {total_rows} matching record(s) from the database."],
        "recommendations": [
            "Cross-reference these results with existing case files.",
            "Verify data integrity before proceeding with investigative actions."
        ],
        "confidence_score": 75,
    }
