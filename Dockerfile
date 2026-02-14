FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# Install system dependencies for resume parsing.
RUN apt-get update && apt-get install -y \
    libmagic1 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
RUN python -m pip install --no-cache-dir alembic

# Optional NLP model download; do not fail image build if unavailable.
RUN python -m spacy download en_core_web_sm || true

COPY alembic.ini .
COPY alembic ./alembic
COPY app ./app
COPY scripts ./scripts
COPY run.py .

RUN mkdir -p uploads/candidate_documents uploads/parsed_resumes uploads/temp

EXPOSE 8000

# Railway provides PORT. Resolve DB URL aliases, run migrations, then start API.
CMD ["sh", "-c", "export DATABASE_URL=\"${DATABASE_URL:-${DATABASE_PRIVATE_URL:-${POSTGRES_URL:-}}}\" && alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port ${PORT:-8000}"]
