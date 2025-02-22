import os
from agno.storage.agent.postgres import PostgresAgentStorage
from agno.storage.workflow.postgres import PostgresWorkflowStorage

class LlmConfig:
    def __init__(self):
        self.__pg_db_url = os.getenv("PG_DB_URL")
    
    def __get_agent_storage(self, table_name: str):
        return PostgresAgentStorage(
            table_name=f"agent_{table_name}",
            db_url=self.__pg_db_url
        )
    
    def __get_workflow_storage(self, table_name: str):
        return PostgresAgentStorage(
            table_name=f"workflow_{table_name}",
            db_url=self.__pg_db_url
        )

    

    