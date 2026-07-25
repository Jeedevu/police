from app.ai.sql_validator import validate_sql

queries = [
    "SELECT * FROM casemaster",
    "DELETE FROM casemaster",
    "DROP TABLE casemaster",
    "UPDATE casemaster SET district='X'",
]

for q in queries:
    print(q)
    print(validate_sql(q))
    print("-" * 40)