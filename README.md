# HirePulse ATS

HirePulse is a full-stack Applicant Tracking System (ATS) with role-based portals for:
- Admin
- Recruiter
- Hiring Manager
- Candidate

It includes:
- End-to-end hiring pipeline (application -> interview -> offer -> joining)
- Resume upload and parsing
- Candidate/job/offer workflow APIs
- Email notification events for candidate lifecycle updates

## Tech Stack

### Backend
- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL (`psycopg2`)

### Frontend
- React + TypeScript + Vite
- Tailwind CSS (local build, no CDN in production)

## Project Structure

```txt
Hirepulse/
  app/                    # FastAPI app (api, models, services, crud)
  alembic/                # DB migrations
  hirepulse-frontend/     # React frontend
  uploads/                # Uploaded files
  run.py                  # Local backend runner
  docker-compose.yml
  Dockerfile
```

## Environment Variables

### Backend (`.env`)

```env
DATABASE_URL=postgresql+psycopg2://user:password@localhost:5432/hirepulse
SECRET_KEY=<set-a-strong-secret>
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
CORS_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173

EMAIL_ENABLED=true
EMAIL_FROM=no-reply@hirepulse.com
SMTP_HOST=localhost
SMTP_PORT=25
SMTP_USER=
SMTP_PASSWORD=
SMTP_USE_TLS=false
```

### Frontend (`hirepulse-frontend/.env`)

```env
VITE_API_BASE_URL=http://localhost:8000
```

### Frontend Production (`hirepulse-frontend/.env.production`)

```env
VITE_API_BASE_URL=https://api.hirepulse.com
```

## Local Setup

### 1. Backend Setup

```bash
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
```

Run migrations:

```bash
alembic upgrade head
```

Start backend:

```bash
python run.py
```

API Docs:
- `http://127.0.0.1:8000/docs`

### 2. Frontend Setup

```bash
cd hirepulse-frontend
npm install
npm run dev
```

Frontend runs on:
- `http://localhost:5173`

## Build Commands

### Frontend Production Build

```bash
cd hirepulse-frontend
npm run build
```

This command:
1. Builds Tailwind CSS locally (`build:css`)
2. Builds Vite production assets

### Backend Tests

```bash
pytest app/tests -q
```

## Docker

Run backend + postgres:

```bash
docker compose up --build
```

Notes:
- `docker-compose.yml` reads `SECRET_KEY` and SMTP vars from your environment.
- Backend DB inside Docker uses:
  `postgresql+psycopg2://hirepulse_user:Admin%40123@postgres:5432/hirepulse`

## Candidate Notification Events

Candidate emails are triggered on:
- Application submitted
- Interview scheduled
- Shortlisted/selected
- Offer released
- Rejected
- Joined

Notification audit records are stored in DB table:
- `notification_logs`

## Deployment Checklist

Before deployment, ensure:
1. `SECRET_KEY` is strong and rotated for production.
2. Production DB URL is set.
3. SMTP credentials are valid (if real email delivery is required).
4. `alembic upgrade head` is executed in production.
5. Frontend `VITE_API_BASE_URL` points to your production backend.
6. CORS origins include only trusted domains.

## Railway Deployment

Deploy as two Railway services from the same GitHub repo:

1. `hirepulse-backend` (root `/`)
2. `hirepulse-frontend` (root `/hirepulse-frontend`)

### Backend service (root `/`)

Railway uses root `Dockerfile` and runs:
- `alembic upgrade head`
- `uvicorn app.main:app --port $PORT`

Set backend variables in Railway:

- `DATABASE_URL` (use Railway PostgreSQL URL; must start with `postgresql+psycopg2://`)
- `SECRET_KEY`
- `ALGORITHM=HS256`
- `ACCESS_TOKEN_EXPIRE_MINUTES=30`
- `CORS_ORIGINS` (include frontend Railway URL and localhost if needed)
- `EMAIL_ENABLED`
- `EMAIL_FROM`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASSWORD`
- `SMTP_USE_TLS`

### Frontend service (`/hirepulse-frontend`)

Railway uses `hirepulse-frontend/Dockerfile`.

Set frontend variable:

- `VITE_API_BASE_URL=https://<your-backend-service>.up.railway.app`

After frontend deploy, update backend `CORS_ORIGINS` with frontend URL.

## Current Migration Head

Latest revision:
- `7e3a1b4c9f10` (adds `notification_logs`)
