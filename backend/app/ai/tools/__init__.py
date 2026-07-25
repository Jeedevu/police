from app.ai.tools.search_cases import execute as search_cases
from app.ai.tools.search_accused import execute as search_accused
from app.ai.tools.search_victim import execute as search_victim
from app.ai.tools.search_evidence import execute as search_evidence
from app.ai.tools.search_vehicle import execute as search_vehicle
from app.ai.tools.search_officer import execute as search_officer
from app.ai.tools.search_network import execute as search_network

TOOL_REGISTRY = {
    "search_cases": search_cases,
    "search_accused": search_accused,
    "search_victim": search_victim,
    "search_evidence": search_evidence,
    "search_vehicle": search_vehicle,
    "search_officer": search_officer,
    "search_network": search_network,
}

def get_tool(name: str):
    return TOOL_REGISTRY.get(name)

def list_tools() -> list[str]:
    return list(TOOL_REGISTRY.keys())

def list_tool_schemas() -> list[dict]:
    return [
        {
            "name": "search_cases",
            "description": "Search cases by crime type, district, status, FIR number, police station, or date range",
            "parameters": {
                "crime_type": "string (optional) - e.g. Theft, Murder, Robbery, Assault, Fraud, Cyber Crime",
                "district": "string (optional) - e.g. Bengaluru, Mysuru, Hubballi",
                "status": "string (optional) - e.g. Pending, Solved, Closed, Investigation",
                "fir_number": "string (optional) - FIR number or partial match",
                "police_station": "string (optional) - police station name",
                "date_from": "string (optional) - ISO date YYYY-MM-DD",
                "date_to": "string (optional) - ISO date YYYY-MM-DD",
                "limit": "integer (optional, default 20) - max results"
            }
        },
        {
            "name": "search_accused",
            "description": "Search accused/suspects by name, case ID, gender, or age range",
            "parameters": {
                "name": "string (optional) - full or partial name",
                "case_id": "integer (optional) - associated case ID",
                "gender": "string (optional) - Male, Female",
                "min_age": "integer (optional) - minimum age",
                "max_age": "integer (optional) - maximum age",
                "limit": "integer (optional, default 20)"
            }
        },
        {
            "name": "search_victim",
            "description": "Search victims by name, case ID, or gender",
            "parameters": {
                "name": "string (optional) - full or partial name",
                "case_id": "integer (optional) - associated case ID",
                "gender": "string (optional) - Male, Female",
                "limit": "integer (optional, default 20)"
            }
        },
        {
            "name": "search_evidence",
            "description": "Search evidence items by case ID, evidence type, or description",
            "parameters": {
                "case_id": "integer (optional) - associated case ID",
                "evidence_type": "string (optional) - type of evidence (e.g. Document, Photo, Video, Forensic)",
                "description": "string (optional) - partial description match",
                "limit": "integer (optional, default 20)"
            }
        },
        {
            "name": "search_vehicle",
            "description": "Search vehicles by registration number, person ID, type, or model",
            "parameters": {
                "registration_number": "string (optional) - partial or full registration",
                "person_id": "integer (optional) - owner person ID",
                "vehicle_type": "string (optional) - e.g. Car, Motorcycle, SUV",
                "model": "string (optional) - vehicle model name",
                "limit": "integer (optional, default 20)"
            }
        },
        {
            "name": "search_officer",
            "description": "Search investigation officers by name, police station, or rank",
            "parameters": {
                "name": "string (optional) - full or partial name",
                "police_station": "string (optional) - station name",
                "rank": "string (optional) - e.g. Inspector, Sub-Inspector, ASI",
                "limit": "integer (optional, default 20)"
            }
        },
        {
            "name": "search_network",
            "description": "Find known associates and relationship network for a person",
            "parameters": {
                "person_id": "integer (required) - person ID to find network for",
                "relationship_type": "string (optional) - filter by relationship type",
                "limit": "integer (optional, default 30)"
            }
        }
    ]
