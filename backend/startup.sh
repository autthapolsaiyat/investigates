#!/bin/bash
# Startup script for Azure App Service
# This script is executed when the container starts

echo "🚀 Starting InvestiGate API..."

# Run database migrations (if using Alembic)
# alembic upgrade head

# Start the application with Gunicorn
exec gunicorn app.main:app \
    --workers 4 \
    --worker-class uvicorn.workers.UvicornWorker \
    --bind 0.0.0.0:8000 \
    --timeout 120 \
    --access-logfile - \
    --error-logfile - \
    --capture-output
