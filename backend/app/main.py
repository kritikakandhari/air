import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from .database import Base, engine, SessionLocal
from .routers import auth, listings, bookings, wishlist, host
from .routers.host import UPLOAD_DIR
from .seed import seed


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(engine)
    with SessionLocal() as db:
        seed(db)  # no-op when data already exists
    yield


app = FastAPI(title="Airbnb Clone API", version="1.0.0", lifespan=lifespan)
app.add_middleware(CORSMiddleware, allow_origins=os.getenv("CORS_ORIGINS", "*").split(","),
                   allow_methods=["*"], allow_headers=["*"])
for r in (auth.router, listings.router, bookings.router, wishlist.router, host.router):
    app.include_router(r)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


@app.get("/api/health")
def health():
    return {"status": "ok"}
