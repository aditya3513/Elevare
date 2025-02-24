from dotenv import load_dotenv
from gpt_researcher import GPTResearcher
load_dotenv()

def get_report_template():
    return """
        # [Title]

        ## Abstract
        [Brief summary]

        ## Introduction
        - **Background:** [Context]
        - **Objective:** [Goal]

        ## Content
        - **Key Points:**
        - [Point 1]
        - [Point 2]
        - **Details/Steps:**
        1. [Step 1]
        2. [Step 2]

        ## Conclusion
        - **Summary:** [Key takeaways]
        - **Next Steps:** [Future directions]

        ## References
        - [Reference 1]
        - [Reference 2]
    """

def get_researcher(query: str, report_type: str = "outline_report"):
    query = f"""Curate a Lesson outline for teaching on the following usery by user: {query}.\n\nFormat for the template: {get_report_template()}"""
    researcher = GPTResearcher(query, report_type, verbose=False, max_subtopics=3)
    return researcher

async def run_report_generation(researcher: GPTResearcher):
    await researcher.conduct_research()
    report = await researcher.write_report()
    return report
