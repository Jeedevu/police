from sqlalchemy import text

from app.database.connection import engine


def execute_query(sql: str):

    with engine.connect() as connection:

        result = connection.execute(text(sql))

        rows = result.mappings().all()

        return rows