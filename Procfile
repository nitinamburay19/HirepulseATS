web: sh -c 'export DATABASE_URL="${DATABASE_URL:-${DATABASE_PRIVATE_URL:-${POSTGRES_URL:-}}}" && python -m alembic upgrade head && python -m uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}'
