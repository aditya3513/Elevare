from agno.workflow import Workflow, RunResponse, RunEvent

AUDIO_FILES_BASE_PATH = "audio_generations"

class SessionManager(Workflow):

    def run(self):
        self.session_state['is_validated'] = True
        return RunResponse(event=RunEvent.workflow_completed)
