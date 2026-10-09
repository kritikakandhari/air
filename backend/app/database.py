"""Database engine / session setup (SQLite by default)."""
import os
from sqlalchemy import create_engine, event
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./airbnb.db")
_is_sqlite = DATABASE_URL.startswith("sqlite")

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False} if _is_sqlite else {})

if _is_sqlite:
    @event.listens_for(engine, "connect")
    def _fk_pragma(dbapi_conn, _):
        cur = dbapi_conn.cursor()
        cur.execute("PRAGMA foreign_keys=ON")  # enforce FK + ON DELETE CASCADE in SQLite
        cur.close()

SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
