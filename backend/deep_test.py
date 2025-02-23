from gpt_researcher import GPTResearcher
from gpt_researcher.utils.enum import ReportType, Tone
import asyncio

async def main():
    # Initialize researcher with deep research type
    researcher = GPTResearcher(
        query="Websockets",
        report_type="deep",  # This triggers deep research modd
    )
    
    # Run research
    research_data = await researcher.conduct_research()
    print(research_data)
    
    # Generate report
    report = await researcher.write_report()
    print(report)

if __name__ == "__main__":
    asyncio.run(main())