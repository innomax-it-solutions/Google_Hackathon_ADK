FROM python:3.12-slim

# Don't write .pyc, unbuffered stdout for clean Cloud Run logs.
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1

WORKDIR /app

# Install deps first so this layer caches across code changes.
COPY backend/requirements.txt ./backend/requirements.txt
RUN pip install --no-cache-dir -r backend/requirements.txt

# Copy the backend package (data/*.json included; .dockerignore drops secrets).
COPY backend/ ./backend/

# Cloud Run injects $PORT (defaults to 8080). uvicorn must bind 0.0.0.0:$PORT.
# backend is a package (relative imports), so run it as backend.main:app from /app.
CMD ["sh", "-c", "uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}"]
