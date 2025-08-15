#!/bin/bash
cd "$(dirname "$0")"
source music-u-env/bin/activate
uvicorn app.main:app --host 0.0.0.0 --port 8080 --reload
