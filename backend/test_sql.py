from app.ai.sql_generator import generate_sql

question = "Show all theft cases"

sql = generate_sql(question)

print(sql)