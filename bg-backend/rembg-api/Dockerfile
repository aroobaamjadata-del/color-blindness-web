# Hugging Face Spaces (Docker) — CPU, single process
FROM python:3.11-slim-bookworm

ENV PYTHONUNBUFFERED=1 \
    OMP_NUM_THREADS=1 \
    MKL_NUM_THREADS=1 \
    OPENBLAS_NUM_THREADS=1 \
    PORT=7860

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .
COPY utils ./utils
COPY static ./static

EXPOSE 7860

# HF Spaces uses 7860; some hosts set PORT — shell form expands it.
CMD ["sh", "-c", "exec uvicorn app:app --host 0.0.0.0 --port ${PORT:-7860}"]
