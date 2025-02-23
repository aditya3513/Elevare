import os
from dotenv import load_dotenv
from agno.storage.agent.postgres import PostgresAgentStorage
from agno.storage.workflow.postgres import PostgresWorkflowStorage
from agno.models.groq import Groq

class LlmConfigs:
    def __init__(self):
        load_dotenv()
        self.__pg_db_url = os.getenv("PG_DB_URL")
    
    def get_agent_storage(self, table_name: str):
        return PostgresAgentStorage(
            table_name=f"agent_{table_name}",
            db_url=self.__pg_db_url
        )
    
    def get_workflow_storage(self, table_name: str):
        return PostgresWorkflowStorage(
            table_name=f"workflow_{table_name}",
            db_url=self.__pg_db_url
        )
    
    def get_groq_base_model(self, use_slm: bool = False, return_json: bool = False):
        config = {}
        # add response format for GROQ
        if return_json:
            config["response_format"] = { "type": "json_object" }
        # switch models for SLM or LLM
        if use_slm:
            config["id"] = "llama-3.1-8b-instant"
        else:
            config["id"] = "llama-3.3-70b-versatile"
        # return custom model
        return Groq(**config)
    
    def get_groq_reasoning_model(self, use_slm: bool = True):
        config = {}
        # add response format for GROQ
        if use_slm:
            config["id"] = "deepseek-r1-distill-qwen-32b"
        else:
            config["id"] = "deepseek-r1-distill-llama-70b"
        # return custom model
        return Groq(**config)

llm_config_handler = LlmConfigs()