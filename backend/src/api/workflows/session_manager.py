from agno.workflow import Workflow, RunResponse, RunEvent

class SessionManager(Workflow):
    
    def run(self, topic):
        self.session_state.setdefault("session", {})
        self.session_state["session"]["is_validated"] = True
        return RunResponse(event=RunEvent.workflow_completed)
