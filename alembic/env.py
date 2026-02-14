from logging.config import fileConfig
import sys
from pathlib import Path
import os

from sqlalchemy import engine_from_config, pool
from alembic import context

# Add project root to PYTHONPATH
sys.path.append(str(Path(__file__).resolve().parents[1]))

from app.database import Base
from app.models import (
    user,
    candidate,
    job,
    mpr,
    agency,
    interview,
    offer,
    blacklist,
    notification,
)

# Alembic Config object
config = context.config

def _normalize_database_url(raw_url: str) -> str:
    url = (raw_url or "").strip()
    if url.startswith("postgres://"):
        return url.replace("postgres://", "postgresql+psycopg2://", 1)
    if url.startswith("postgresql://"):
        return url.replace("postgresql://", "postgresql+psycopg2://", 1)
    return url


def _for_alembic_config(url: str) -> str:
    """
    Escape `%` for ConfigParser interpolation used by Alembic config.
    """
    return url.replace("%", "%%")


# Prefer DATABASE_URL from environment (Railway/containers), fallback to alembic.ini.
database_url = os.getenv("DATABASE_URL")
if database_url:
    config.set_main_option(
        "sqlalchemy.url",
        _for_alembic_config(_normalize_database_url(database_url)),
    )
else:
    host = os.getenv("PGHOST")
    port = os.getenv("PGPORT", "5432")
    user_name = os.getenv("PGUSER")
    password = os.getenv("PGPASSWORD")
    dbname = os.getenv("PGDATABASE")
    if host and user_name and password and dbname:
        config.set_main_option(
            "sqlalchemy.url",
            _for_alembic_config(
                f"postgresql+psycopg2://{user_name}:{password}@{host}:{port}/{dbname}"
            ),
        )

# Configure logging
if config.config_file_name is not None:
    fileConfig(config.config_file_name)

# Metadata for autogenerate
target_metadata = Base.metadata


def run_migrations_offline() -> None:
    """Run migrations in offline mode."""
    url = config.get_main_option("sqlalchemy.url")

    context.configure(
        url=url,
        target_metadata=target_metadata,
        literal_binds=True,
        compare_type=True,
        compare_server_default=True,
    )

    with context.begin_transaction():
        context.run_migrations()


def run_migrations_online() -> None:
    """Run migrations in online mode."""
    connectable = engine_from_config(
        config.get_section(config.config_ini_section),
        prefix="sqlalchemy.",
        poolclass=pool.NullPool,
    )

    with connectable.connect() as connection:
        context.configure(
            connection=connection,
            target_metadata=target_metadata,
            compare_type=True,
            compare_server_default=True,
        )

        with context.begin_transaction():
            context.run_migrations()


if context.is_offline_mode():
    run_migrations_offline()
else:
    run_migrations_online()
