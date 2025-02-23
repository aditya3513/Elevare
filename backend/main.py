import uvicorn
import multiprocessing
from fastapi import FastAPI
from fastapi import Response
from fastapi.middleware.cors import CORSMiddleware
from src.api.routes import sessions

def calculate_workers():
    return (multiprocessing.cpu_count() * 2) + 1


app = FastAPI(
        title="Elevare API",
        version="0.0.1"
    )

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Health check endpoint
@app.get("/health")
async def health():
    return Response(status_code=200, content="API is Running")

app.include_router(sessions.router)

if __name__ == "__main__":
    uvicorn_config = {
        "app": "main:app",
        "workers": calculate_workers(),
        "port": 9000,
        "host": "0.0.0.0",
        "reload": True,
        "log_level": "debug"
    }
    uvicorn.run(**uvicorn_config)