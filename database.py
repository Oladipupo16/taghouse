from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

# This is your connection to the database
DATABASE_URL = "postgresql://taskdb_0u7m_user:KnLtRqwN82M9d0YF1JPsDWvRH7SIg9aR@dpg-d912h4j7uimc739qvt6g-a.oregon-postgres.render.com/taskdb_0u7m"

engine = create_engine(DATABASE_URL)

SessionLocal = sessionmaker(bind=engine)

Base = declarative_base()

# This gives us a database connection when we need it
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()