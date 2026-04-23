# =============================================================================
# Capital Markets AI Safety Demo - Single-image build
# Stage 1: build React frontend
# Stage 2: Python backend that serves the built frontend + API
# =============================================================================

# ---- Stage 1: Frontend build ----
FROM node:20-alpine AS frontend-builder
WORKDIR /build
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build
# Output: /build/dist

# ---- Stage 2: Backend + static frontend ----
FROM python:3.11-slim
WORKDIR /app

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy backend source
COPY backend/ ./backend/

# Copy compiled frontend into backend/static so FastAPI can serve it
COPY --from=frontend-builder /build/dist ./backend/static/

WORKDIR /app/backend

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
