from dotenv import load_dotenv
from gpt_researcher import GPTResearcher
load_dotenv()

def get_researcher(query: str, report_type: str = "outline_report"):
    query = f"""Curate a Lesson outline for teaching on the following usery by user: {query}."""
    researcher = GPTResearcher(query, report_type, verbose=False, max_subtopics=3)
    return researcher

async def run_report_generation(researcher: GPTResearcher):
    await researcher.conduct_research()
    report = await researcher.write_report()
    return report
