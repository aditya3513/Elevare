from agno.agent import Agent
from src.config.llm_config import llm_config_handler
from typing import Optional, List, Dict
from pydantic import BaseModel, Field

class LearningElement(BaseModel):
    type: str = Field(..., description="Type of element (definition, example, exercise, etc.)")
    content: str = Field(..., description="The actual content")
    difficulty: str = Field(..., description="Difficulty level of this element")
    estimated_time: str = Field(..., description="Estimated time to complete/understand")

class ConceptBreakdown(BaseModel):
    title: str = Field(..., description="Title of the concept")
    simple_explanation: str = Field(..., description="Feynman-style simple explanation")
    detailed_explanation: str = Field(..., description="More detailed technical explanation")
    analogies: List[str] = Field(..., description="Real-world analogies to explain the concept")
    common_misconceptions: List[str] = Field(..., description="Common misunderstandings to address")

class PracticeItem(BaseModel):
    title: str
    problem: str
    solution: str
    explanation: str = Field(..., description="Feynman-style explanation of the solution")
    difficulty: str
    related_concepts: List[str]

class StudyGuide(BaseModel):
    topic: str
    difficulty_level: str
    estimated_study_time: str
    prerequisites: List[ConceptBreakdown] = Field(..., description="Required concepts explained simply")
    learning_path: List[Dict[str, str]] = Field(..., description="Step-by-step learning progression")
    concepts: List[ConceptBreakdown]
    practice_items: List[PracticeItem]
    self_check_questions: List[Dict[str, str]]
    teaching_suggestions: Optional[Dict[str, str]]
    additional_resources: Dict[str, str]

agent = Agent(
    model=llm_config_handler.get_openai_base_model(),
    description="""You are an expert Study Guide Planning agent that specializes in breaking down complex topics into easily digestible content using the Feynman Technique. 
    You analyze the input topic and difficulty level to generate comprehensive study materials that include both self-study components and structured lesson elements, making it suitable for both individual learners and classroom settings."
    """,
    instructions=[
"""You are an expert educator who specializes in the Feynman Technique. 
- Explaining complex topics in simple terms. 
- Your goal is to create comprehensive study materials that anyone can understand.""",
"""First, analyze the input topic and requirements:
   - Identify the core concepts that need to be explained
   - Determine appropriate difficulty level and prerequisites
   - Map out a logical learning progression""",
"""For each concept in the topic:
   - Break it down to its simplest form
   - Create clear, jargon-free explanations
   - Develop relevant real-world analogies
   - Identify and address common misconceptions""",
"""Create practice materials that:
   - Start with basic understanding
   - Progress to complex applications
   - Include detailed explanations for each solution
   - Connect to real-world scenarios""",
"""Incorporate self-assessment elements:
   - Understanding checks after each concept
   - Practice problems with step-by-step solutions
   - Real-world application exercises
   - Reflection questions for deeper learning""",
"""Provide teaching support:
   - Suggested teaching approaches
   - Common student stumbling points
   - Alternative explanation strategies
   - Group activity suggestions""",
"""Ensure all content follows these principles:
   - Use simple language to explain complex ideas
   - Include concrete examples and analogies
   - Build concepts progressively
   - Connect to learners' existing knowledge
   - Provide opportunities for active learning""",
"""Each explanation should follow the Feynman Technique steps:
   - Explain as if teaching a complete beginner
   - Identify gaps in your explanation
   - Return to source material to fill gaps
   - Simplify and use analogies""",
"""For every practice item:
   - State the problem clearly
   - Provide a detailed solution
   - Explain why this solution works
   - Connect to fundamental concepts""",
"""Validate the final output:
    - Ensure all explanations are clear and simple
    - Check that practice items match the difficulty level
    - Verify all concepts build logically
    - Confirm real-world applications are included"""
           ],
    markdown=False,
    response_model=StudyGuide
)