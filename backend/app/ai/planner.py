import json
import re
from app.ai.catalyst_client import ask_llm
from app.ai.tools import list_tool_schemas
from app.utils.logger import logger


PLANNER_SYSTEM_PROMPT = """You are an AI investigation planner for Karnataka Police.
Your role is to decide which database tools to call based on the officer's question.

Available tools:
{tool_descriptions}

Rules:
1. Return ONLY a JSON array of tool calls. No explanations, no SQL, no markdown.
2. Each tool call must be: {{"tool": "tool_name", "arguments": {{...}}}}
3. Only include arguments directly mentioned in or clearly implied by the question.
4. Use partial/fuzzy values for names and text fields (ILIKE will be used).
5. If the question is ambiguous, choose the most likely tool based on context.
6. If no tool matches, return an empty array [].

Spelling correction hints:
- thrift, theif, steeling -> use crime_type=Theft
- murdur, muder, kole -> use crime_type=Murder
- robery, darode -> use crime_type=Robbery
- halle, assault -> use crime_type=Assault
- cyberattack, cyber-attack -> use crime_type=Cyber Crime
- vanchana, fraud -> use crime_type=Fraud
- offender, aaropi -> search_accused
- saskiya, evidence -> search_evidence
- vahana -> search_vehicle

If the question is in Kannada, still extract the intent and map to the correct English tool arguments.

Examples:
Question: Show theft cases in Bengaluru
Response: [{{"tool": "search_cases", "arguments": {{"crime_type": "Theft", "district": "Bengaluru"}}}}]

Question: Who owns vehicle KA01AB1234
Response: [{{"tool": "search_vehicle", "arguments": {{"registration_number": "KA01AB1234"}}}}]

Question: Find repeat offenders
Response: [{{"tool": "search_accused", "arguments": {{}}}}]

Question: Show evidence for case 5
Response: [{{"tool": "search_evidence", "arguments": {{"case_id": 5}}}}]

Question: Find accused named Ramesh
Response: [{{"tool": "search_accused", "arguments": {{"name": "Ramesh"}}}}]

Question: Show me murder cases in Mysuru
Response: [{{"tool": "search_cases", "arguments": {{"crime_type": "Murder", "district": "Mysuru"}}}}]

Question: What vehicles does person 3 own
Response: [{{"tool": "search_vehicle", "arguments": {{"person_id": 3}}}}]

Question: Who are the known associates of person 7
Response: [{{"tool": "search_network", "arguments": {{"person_id": 7}}}}]"""


def build_planner_prompt(question: str) -> str:
    tool_schemas = list_tool_schemas()
    descriptions = []
    for t in tool_schemas:
        params_desc = []
        for pname, pdesc in t["parameters"].items():
            params_desc.append(f"    - {pname}: {pdesc}")
        params_str = "\n".join(params_desc)
        descriptions.append(f"- {t['name']}: {t['description']}\n  Parameters:\n{params_str}")

    system = PLANNER_SYSTEM_PROMPT.replace("{tool_descriptions}", "\n\n".join(descriptions))

    return f"{system}\n\nQuestion: {question}\n\nResponse (JSON only):"


def extract_json_array(text: str) -> list[dict]:
    text = text.strip()
    json_match = re.search(r"\[.*?\]", text, re.DOTALL)
    if json_match:
        try:
            return json.loads(json_match.group(0))
        except json.JSONDecodeError:
            pass
    try:
        return json.loads(text)
    except (json.JSONDecodeError, ValueError):
        logger.error(f"Failed to parse planner JSON from: {text[:200]}")
        return []


def plan(question: str) -> list[dict]:
    prompt = build_planner_prompt(question)
    try:
        raw_response = ask_llm(prompt)
        clean = raw_response.strip().strip("`").strip()
        if clean.lower().startswith("json"):
            clean = clean[4:].strip().strip("`").strip()
        tool_calls = extract_json_array(clean)
        if isinstance(tool_calls, dict) and "tool_calls" in tool_calls:
            tool_calls = tool_calls["tool_calls"]
        if not isinstance(tool_calls, list):
            logger.warning(f"Planner returned non-list: {type(tool_calls)}")
            return []
        for tc in tool_calls:
            if "arguments" not in tc:
                tc["arguments"] = {}
        logger.info(f"Planner decided: {tool_calls}")
        return tool_calls
    except Exception as e:
        logger.error(f"Planner error: {e}")
        return []
