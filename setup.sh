#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

cd "$ROOT_DIR/backend"
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python3 seed.py

cd "$ROOT_DIR/frontend"
npm install

echo "Setup complete."
echo "Start the backend: cd backend && source .venv/bin/activate && uvicorn main:app --reload --port 8000"
echo "Start the frontend: cd frontend && npm run dev"
