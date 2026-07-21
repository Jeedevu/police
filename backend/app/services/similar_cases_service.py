from sqlalchemy import text
from app.database.connection import engine


def get_similar_cases(case_id: int):
    """
    Find similar cases based on:
    1. Same crime type
    2. Same district
    3. Common accused names
    4. Common vehicle registration numbers
    5. Common phone numbers
    """
    with engine.connect() as conn:
        # Fetch the reference case
        ref_case = conn.execute(
            text("SELECT * FROM casemaster WHERE case_id = :id"),
            {"id": case_id}
        ).mappings().first()

        if not ref_case:
            return {"similar_cases": [], "reason": "Reference case not found"}

        crime_type = ref_case["crime_type"]
        district = ref_case["district"]

        # Get accused names in this case
        accused_names = conn.execute(
            text("SELECT name FROM accused WHERE case_id = :id"),
            {"id": case_id}
        ).scalars().all()

        # Get vehicle registrations linked to accused in this case
        reg_numbers = conn.execute(
            text("""
                SELECT DISTINCT v.registration_number
                FROM accused a
                JOIN personidentity p ON a.name = p.full_name
                JOIN vehicle v ON v.person_id = p.person_id
                WHERE a.case_id = :id
            """),
            {"id": case_id}
        ).scalars().all()

        # Get phones linked to accused in this case
        phones = conn.execute(
            text("""
                SELECT DISTINCT ph.mobile
                FROM accused a
                JOIN personidentity p ON a.name = p.full_name
                JOIN phone ph ON ph.person_id = p.person_id
                WHERE a.case_id = :id
            """),
            {"id": case_id}
        ).scalars().all()

        similar_map = {}  # case_id -> {case_data, score, match_reasons}

        def add_match(c, reason, score_delta=1):
            cid = c["case_id"]
            if cid == case_id:
                return
            if cid not in similar_map:
                similar_map[cid] = {
                    "case_id": cid,
                    "fir_number": c["fir_number"],
                    "crime_type": c["crime_type"],
                    "district": c["district"],
                    "case_status": c["case_status"],
                    "crime_date": str(c["crime_date"]) if c["crime_date"] else None,
                    "police_station": c["police_station"],
                    "score": 0,
                    "match_reasons": []
                }
            similar_map[cid]["score"] += score_delta
            if reason not in similar_map[cid]["match_reasons"]:
                similar_map[cid]["match_reasons"].append(reason)

        # 1. Same crime type + district (strongest signal)
        same_type_district = conn.execute(
            text("""
                SELECT * FROM casemaster
                WHERE crime_type ILIKE :ct AND district ILIKE :d AND case_id != :id
                LIMIT 5
            """),
            {"ct": f"%{crime_type}%", "d": f"%{district}%", "id": case_id}
        ).mappings().all()
        for c in same_type_district:
            add_match(c, f"Same crime type ({crime_type}) & district ({district})", 3)

        # 2. Same crime type only
        same_type = conn.execute(
            text("""
                SELECT * FROM casemaster
                WHERE crime_type ILIKE :ct AND case_id != :id
                LIMIT 5
            """),
            {"ct": f"%{crime_type}%", "id": case_id}
        ).mappings().all()
        for c in same_type:
            add_match(c, f"Same crime type ({crime_type})", 2)

        # 3. Same district
        same_district = conn.execute(
            text("""
                SELECT * FROM casemaster
                WHERE district ILIKE :d AND case_id != :id
                LIMIT 5
            """),
            {"d": f"%{district}%", "id": case_id}
        ).mappings().all()
        for c in same_district:
            add_match(c, f"Same district ({district})", 1)

        # 4. Common accused
        for name in accused_names:
            if not name:
                continue
            matches = conn.execute(
                text("""
                    SELECT cm.* FROM accused a
                    JOIN casemaster cm ON a.case_id = cm.case_id
                    WHERE a.name ILIKE :n AND a.case_id != :id
                    LIMIT 3
                """),
                {"n": f"%{name}%", "id": case_id}
            ).mappings().all()
            for c in matches:
                add_match(c, f"Common suspect: {name}", 4)

        # 5. Common vehicle
        for reg in reg_numbers:
            if not reg:
                continue
            matches = conn.execute(
                text("""
                    SELECT DISTINCT cm.* FROM accused a
                    JOIN personidentity p ON a.name = p.full_name
                    JOIN vehicle v ON v.person_id = p.person_id
                    JOIN casemaster cm ON a.case_id = cm.case_id
                    WHERE v.registration_number ILIKE :reg AND a.case_id != :id
                    LIMIT 3
                """),
                {"reg": f"%{reg}%", "id": case_id}
            ).mappings().all()
            for c in matches:
                add_match(c, f"Same vehicle: {reg}", 5)

        # 6. Common phone
        for phone in phones:
            if not phone:
                continue
            matches = conn.execute(
                text("""
                    SELECT DISTINCT cm.* FROM accused a
                    JOIN personidentity p ON a.name = p.full_name
                    JOIN phone ph ON ph.person_id = p.person_id
                    JOIN casemaster cm ON a.case_id = cm.case_id
                    WHERE ph.mobile ILIKE :ph AND a.case_id != :id
                    LIMIT 3
                """),
                {"ph": f"%{phone}%", "id": case_id}
            ).mappings().all()
            for c in matches:
                add_match(c, f"Common phone: {phone}", 5)

        # Sort by score descending, return top 10
        sorted_cases = sorted(similar_map.values(), key=lambda x: x["score"], reverse=True)[:10]

        return {
            "reference_case_id": case_id,
            "reference_fir": ref_case["fir_number"],
            "reference_crime_type": crime_type,
            "similar_cases": sorted_cases
        }
