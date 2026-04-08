"""
run.py — Local development entry point.
Production uses: uvicorn app.main:app --host 0.0.0.0 --port 8000
"""

import uvicorn
from app.config import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.host,
        port=settings.port,
        reload=True,          # hot-reload in dev
        log_level="info",
    )
