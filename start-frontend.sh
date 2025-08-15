#!/bin/bash
cd "$(dirname "$0")/app"
if command -v yarn &> /dev/null && [ -f "yarn.lock" ]; then
    yarn dev
else
    npm run dev
fi
