from sqlalchemy import text
from app.database.connection import engine


def execute_sql(sql: str):
    with engine.connect() as conn:
        result = conn.execute(text(sql))

        try:
            return [dict(row._mapping) for row in result]
        except Exception:
            return []