# TheForge

Arise is a local-first personal progression system for health, wealth, happiness, and mastery.

## Setup

For one-shot project setup, run from the repo root:

```bash
./setup.sh
```

This creates `backend/.venv`, installs backend dependencies, seeds SQLite, and installs frontend dependencies.

## Backend

Install and seed manually:

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 seed.py
```

Run the backend:

```bash
cd backend
source .venv/bin/activate
uvicorn main:app --reload --port 8000
```

Health check, from another terminal:

```bash
curl http://localhost:8000/health
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` and proxies `/api` to `http://localhost:8000`.

## Run the Project

Start both backend and frontend from the repo root:

```bash
./run.sh
```

Then open `http://localhost:5173`. The backend runs at `http://localhost:8000`.

The terminal shows an animated ASCII forge while the services are running. Service output is written to:

```text
.logs/backend.log
.logs/frontend.log
```

## Stop Services

If services are running through `./run.sh`, press `Ctrl+C` in that terminal to stop both.

If a service is still occupying a port, stop it by port:

```bash
lsof -ti :8000 | xargs kill
lsof -ti :5173 | xargs kill
```

If you see no output from `lsof`, nothing is running on that port.

## SQLite Database

The app uses SQLite. The database file is created at:

```text
backend/theforge.db
```

You can inspect it with:

```bash
sqlite3 backend/theforge.db ".tables"
```
