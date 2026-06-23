from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from config import settings

# For local development with SQLite, make sure sqlite+aiosqlite is used.
# If DATABASE_URL is standard sqlite:///, swap to sqlite+aiosqlite:///.
db_url = settings.DATABASE_URL
if db_url.startswith("sqlite:///"):
    db_url = db_url.replace("sqlite:///", "sqlite+aiosqlite:///")

is_sqlite = db_url.startswith("sqlite")

connect_args = {}
if is_sqlite:
    # check_same_thread is only needed for sqlite
    connect_args = {"check_same_thread": False}

engine = create_async_engine(
    db_url,
    connect_args=connect_args,
    echo=False,
)

SessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    async with SessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
