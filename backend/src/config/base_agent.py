from abc import ABC, abstractmethod
from typing import List, Optional, Dict, Any
from agno.agent import Agent


class BaseAgent(ABC):
    def __init__(self, session_id: Optional[str] = None):
        config = self.get_agent_config()
        config["session_id"] = session_id  # Inject session_id into the config
        self.agent = Agent(**config)

    def get_agent_config(self) -> Dict[str, Any]:
        # Check if storage is enabled (truthy value).
        storage = self.get_storage()
        storage_enabled = bool(storage)

        # Determine if a response model is provided.
        # If yes, then we use that for structured output and disable markdown.
        response_model = self.get_response_model()
        markdown = False if response_model else True

        reasoning_llm = self.get_reasoning_llm()
        reasoning_enabled = True if reasoning_llm else False

        return {
            "name": self.get_name(),
            "model": self.get_base_llm(),
            "reasoning": reasoning_enabled,
            "reasoning_model": reasoning_llm,
            "markdown": markdown,
            "response_model": response_model,
            "storage": storage,
            "read_chat_history": storage_enabled,
            "add_history_to_messages": storage_enabled,
            "description": self.get_description(),
            "instructions": self.get_instructions()
        }

    @abstractmethod
    def get_role(self) -> str:
        """Return the role of the agent."""
        pass

    @abstractmethod
    def get_description(self) -> str:
        """Return a description of the agent."""
        pass

    @abstractmethod
    def get_instructions(self) -> List[str]:
        """Return a list of instructions for the agent."""
        pass

    @abstractmethod
    def get_name(self) -> str:
        """Return the name of the agent."""
        pass

    @abstractmethod
    def get_base_llm(self):
        """Return the model instance to be used for base agent."""
        pass

    @abstractmethod
    def get_reasoning_llm(self):
        """Return the model instance to be used for reasoning."""
        pass

    @abstractmethod
    def get_storage(self):
        """Return the storage mechanism for agent-related data."""
        pass

    def get_response_model(self) -> Optional[Any]:
        """
        Return a Pydantic model for structured responses if needed.
        If a valid model is provided, markdown responses will be disabled.
        By default, this returns None (i.e. use markdown).
        """
        return None

