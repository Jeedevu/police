from sqlalchemy.orm import Session
from app.ai.tools import get_tool, list_tools
from app.utils.logger import logger


def route(tool_calls: list[dict], db: Session) -> list[dict]:
    if not tool_calls:
        return []

    results = []
    available_tools = list_tools()

    for call in tool_calls:
        tool_name = call.get("tool", "")
        arguments = call.get("arguments", {})

        if not isinstance(arguments, dict):
            arguments = {}

        if tool_name not in available_tools:
            logger.warning(f"Unknown tool requested: {tool_name}")
            results.append({
                "tool": tool_name,
                "success": False,
                "error": f"Unknown tool: {tool_name}",
                "data": [],
            })
            continue

        try:
            tool_fn = get_tool(tool_name)
            data = tool_fn(db=db, **arguments)

            if not isinstance(data, list):
                data = []

            results.append({
                "tool": tool_name,
                "arguments": arguments,
                "success": True,
                "row_count": len(data),
                "data": data,
            })

            logger.info(f"Tool {tool_name} returned {len(data)} rows")

        except Exception as e:
            logger.error(f"Tool {tool_name} execution error: {e}")
            results.append({
                "tool": tool_name,
                "arguments": arguments,
                "success": False,
                "error": str(e),
                "data": [],
            })

    return results
