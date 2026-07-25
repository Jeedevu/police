from sqlalchemy import text
from app.database.connection import engine


def load_schema():

    sql = """
    SELECT
        table_name,
        column_name,
        data_type
    FROM information_schema.columns
    WHERE table_schema='public'
    ORDER BY table_name, ordinal_position;
    """

    with engine.connect() as conn:
        rows = conn.execute(text(sql)).mappings().all()

    schema = {}

    for row in rows:

        table = row["table_name"]

        if table not in schema:
            schema[table] = []

        schema[table].append(
            f"- {row['column_name']} ({row['data_type']})"
        )

    prompt = ""

    for table, columns in schema.items():

        prompt += f"\nTable: {table}\n"

        prompt += "Columns:\n"

        prompt += "\n".join(columns)

        prompt += "\n"

    return prompt