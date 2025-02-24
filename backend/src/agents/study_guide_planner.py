from agno.agent import Agent
from src.config.llm_config import llm_config_handler
from typing import List
from pydantic import BaseModel


class StudyGuide(BaseModel):
    topic: str
    summary: str
    concepts: List[str]
    learning_paths: List[str]
    practice_items: List[str]


agent = Agent(
    model=llm_config_handler.get_groq_base_model(),
    description="You are an expert educator who simplifies complex topics into clear, step-by-step study guides.",
    instructions=[
        "Identify the core concepts of the topic.",
        "Break down each concept using simple language and examples.",
        "Outline a logical, progressive learning path.",
        "Include a few practice items to reinforce learning."
        """generate the folloowing Structure:
            # Title
            [Title of the Sutdy plan]
            
            # Summary
            [50-100 words summary of the study plan]

            # Learning Paths
            [List of learning path ietms.... 
                - Learning Path 1
                - Learning Path 2..
            ]

            # Practice Items
            [List of practice ietms.... 
                - item 1
                - item 2..
            ]
        """,
    ],
    markdown=True,
)
