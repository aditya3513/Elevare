from gpt_researcher import GPTResearcher
import asyncio

async def get_report(query: str, report_type: str):
    researcher = GPTResearcher(query, report_type, verbose=False)
    research_result = await researcher.conduct_research()
    
    # Get additional information
    research_context = researcher.get_research_context()
    research_costs = researcher.get_costs()
    research_images = researcher.get_research_images()
    research_sources = researcher.get_research_sources()

    report = await researcher.write_report()
    
    return report, research_context, research_costs, research_images, research_sources

if __name__ == "__main__":
    topic = "photosynthesis"
    query = f"Create a course outline for the following topic: {topic}"
    report_type = "outline_report"

    report, context, costs, images, sources = asyncio.run(get_report(query, report_type))
    
    print("Report:")
    print(report)
    print("\nResearch Costs:")
    print(costs)
    print("\nNumber of Research Images:")
    print(images)
    print(len(images))
    print("\nNumber of Research Sources:")
    print(sources)
    print(len(sources))