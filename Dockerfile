FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for resume parsing
RUN apt-get update && apt-get install -y \
    libmagic1 \
    poppler-utils \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install spaCy model
RUN python -m spacy download en_core_web_sm

COPY . .

# Create upload directories
RUN mkdir -p uploads/candidate_documents uploads/parsed_resumes

RUN python -m pip install alembic

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]