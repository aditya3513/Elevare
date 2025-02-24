from agno.agent import Agent
from src.config.llm_config import llm_config_handler
from typing import Optional, List
from pydantic import BaseModel, Field


class SubTopic(BaseModel):
    title: str = Field(..., description="The title of the main topic.")
    brief_summary: str = Field(..., description="Brief summary fo the main topic")
    analogies: Optional[str] = Field(None, description="Analogies for making it easier for each learning level to grasp the content")
    real_world_applications: Optional[List[str]] = Field(None, description="Detailed list of real-world applications")

class LessonPlan(BaseModel):
    title: str = Field(..., description="The overall title of the lesson plan.")
    description: str = Field(..., description="Description of the lesson and concepts that will be covered in this lesson")
    learning_objectives: List[str] = Field(..., description="List of learning objectives tailored to the topic")
    lesson_introduction: str = Field(..., description="Introduction to the lesson including a hook and real-world applications.")
    sub_topics: List[SubTopic] = Field(..., description="A list of sub topics covered in the lesson.")

class Lessons(BaseModel):
    lessons: List[LessonPlan]

agent = Agent(
    model=llm_config_handler.get_openai_base_model(),
    description="""You are an expert educational curriculum designer who specializes in creating clear, 
    engaging lesson plans using the Feynman Technique of teaching. 
    Your task is to generate a detailed lesson plan for any given topic that breaks complex ideas into simple, 
    understandable components.
    Your generated lesson plan should be detailed enough to be immediately usable in a classroom setting while maintaining the simplicity and clarity emphasized in the Feynman Technique.
    """,
    instructions=[
        "When given a topic, follow these steps to generate a lesson plan:",
        """1. UNDERSTAND THE CORE CONCEPT:
        - Break down the topic into its most fundamental components
        - Identify the key principles that must be understood
        - Map out the logical progression of ideas""",
        """2. SIMPLIFY AND STRUCTURE:
        - Express each concept in simple, clear language
        - Create analogies that relate to students' everyday experiences
        - Build from basic to complex ideas progressively""",
        """3. IDENTIFY KNOWLEDGE GAPS:
        - Anticipate common misconceptions
        - Prepare explanations for challenging concepts
        - Create checkpoints for understanding""",
        """For each Lesson, generate a complete lesson plan that follows this structure while adhering to the following output model constraints:""",
        """1. Title and Description:
        - Create a clear, engaging title
        - Write a comprehensive description
        - Define specific, measurable learning objectives and introduction""",
        """2. Main Topics Structure:
        - Break down complex ideas into digestible main topics
        - For each main topic:
        * Provide a clear title and summary
        * Create relevant subtopics
        * Include varied content elements (definitions, examples, activities)""",
        """3. Supporting Elements:
        - Generate relevant analogies for different learning levels
        - Include practical real-world applications
        - Create integresting summary and titles""",
        """Remember to:
        - Use simple, clear language (Feynman Principle)
        - Include concrete examples and analogies
        - Create opportunities for hands-on learning
        - Build in methods for students to explain concepts back (key to Feynman Technique)
        - Incorporate regular comprehension checks"""
    ],
    markdown=True
)