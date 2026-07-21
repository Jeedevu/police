from app.database.connection import engine

from app.database.base import Base

import app.models.case


Base.metadata.create_all(bind=engine)

print("Tables created successfully.")