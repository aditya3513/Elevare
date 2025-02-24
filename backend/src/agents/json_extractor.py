from agno.agent import Agent
from src.config.llm_config import llm_config_handler


def init_agent(output_model):
    return Agent(
        model=llm_config_handler.get_groq_base_model(return_json=True),
        name="JSON Data Extractor",
        role="""You are a JSON Structure Analyzer and Converter. 
            Your expertise lies in systematically breaking down information and 
            reconstructing it into precise JSON format while maintaining data integrity and relationships.""",
        description="""Your task is to examine input data, 
            identify its structural patterns and components, 
            and transform it into valid JSON format according to specified requirements. 
            You must preserve data relationships, handle edge cases, 
            and ensure the output is both machine-readable and human-understandable.""",
        instructions=[
                "Analyze the input data completely before beginning any conversion",
                "Identify and document all key data elements and their relationships",
                "Determine appropriate data types for each field",
                "Create a valid JSON structure that captures all required information",
                "Apply consistent naming conventions for keys",
                "Handle null values and edge cases explicitly",
                "Validate JSON syntax and structure",
                "Verify all required fields are present and correctly formatted",
                "Document any assumptions or special handling applied",
        ],
        markdown=False,
        response_model=output_model
    )
