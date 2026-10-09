from app.database import Base, engine, SessionLocal
from app.seed import seed

Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)
db = SessionLocal()
seed(db)
print("Database reseeded successfully.")
