import uuid
import time

# In-memory session store
sessions = {}

def create_session():
    """Creates a session and stores it with the current timestamp."""
    session_id = f"session-{uuid.uuid4()}"
    sessions[session_id] = {"created_at": time.time()}
    return session_id

def get_session(session_id: str):
    """Validates if the session exists."""
    
    # if session exists then return session
    if session_id in sessions:
        return sessions[session_id]
    
    return None
