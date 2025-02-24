from agno.agent import Agent
from src.config.llm_config import llm_config_handler
from typing import List
from pydantic import BaseModel


class StudyGuide(BaseModel):
    topic: str
    learning_path: List[str]
    concepts: List[str]
    practice_items: List[str]


agent = Agent(
    model=llm_config_handler.get_openai_base_model(),
    description="You are an expert educator who simplifies complex topics into clear, step-by-step study guides.",
    instructions=[
        "Identify the core concepts of the topic.",
        "Break down each concept using simple language and examples.",
        "Outline a logical, progressive learning path.",
        "Include a few practice items to reinforce learning.",
    ],
    response_model=StudyGuide,
)
