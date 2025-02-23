from agno.workflow import Workflow, RunResponse, RunEvent

AUDIO_FILES_BASE_PATH = "audio_generations"

class SessionManager(Workflow):
    
    def _mark_validated(self):
        self.session_state.setdefault("session", {})
        self.session_state["session"]["is_validated"] = True

    def run(self):
        self._mark_validated()
        return RunResponse(event=RunEvent.workflow_completed)
