# TheForge

Arise is a local-first personal progression system that turns daily work into quests, XP, ranks, gold, attributes, campaigns, weekly reflection, and a companion-led dashboard. It is built as a FastAPI + SQLite backend with a React/Tailwind frontend and is designed to run offline on a single developer machine.

## Prerequisites

- Python 3.11+
- Node 20+

## Setup

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python seed.py
uvicorn main:app --reload --port 8000
```

### Frontend

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. The Vite dev server proxies `/api` to `http://localhost:8000`.

## Run Tests

```bash
cd backend
pytest tests/ -v
```

## Reset Data

Delete the SQLite database and seed it again:

```bash
cd backend
rm theforge.db
python seed.py
```

## Design Spec

See [DESIGN_SPEC_V2.md](./DESIGN_SPEC_V2.md) for the product, API, data model, visual style, and acceptance criteria.
