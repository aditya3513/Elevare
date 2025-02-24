import json
from agno.agent import Agent
from agno.workflow import Workflow, RunResponse, RunEvent
from agno.utils.log import logger
from src.agents import confirmation_message_generator
from gpt_researcher import GPTResearcher
from typing import Iterator

class DeepResearcher(Workflow):
    # create base voice agent for feedback
    confirmation_agent: Agent = confirmation_message_generator.agent
    custom_events = [
        "RESEARCH_REPORT", 
        "AUDIO_TRANSCRIPT", 
        "RESEARCH_CONTEXT", 
        "RESEARCH_SOURCES", 
        "RESEARCH_IMAGES"]

    
    
    def __fetch_images(self):
        images = self.researcher.get_research_images()
        return images
    
    def __fetch_sources(self):
        sources = self.researcher.get_research_sources()
        return sources
    
    def __fetch_research_context(self):
        context = self.researcher.get_research_context()
        return context

    
    def __generate_confirmation_msg(self, topic: str) -> str:
        logger.info("Confirmation Msg Generation Started (Attempt 1)...")
        confirmation_msg_response = self.confirmation_agent.run(topic)
        logger.info("Confirmation Msg Generation Finished...")
        return confirmation_msg_response.content

    def run(self, topic: str, researcher: GPTResearcher, report) -> Iterator[RunResponse]:
        # init research state
        current_research = {}
        self.researcher = researcher

        # init report state
        current_research["report"] = report
        yield RunResponse(
            event="RESEARCH_REPORT",
            content=json.dumps(report)
        )
        
        # send report summary for voice
        resport_gen_msg = self.__generate_confirmation_msg(f"Write a short 100 word summary for the report. Report: {report}")
        yield RunResponse(
            event="AUDIO_TRANSCRIPT",
            content=resport_gen_msg
        )
        
        # fetch context
        context = self.__fetch_research_context()
        current_research["context"] = context
        yield RunResponse(
            event="RESEARCH_CONTEXT",
            content=json.dumps(context)
        )

        # fetch sources
        sources = self.__fetch_sources()
        current_research["sources"] = sources
        yield RunResponse(
            event="RESEARCH_SOURCES",
            content=json.dumps(sources)
        )

        # fetch images
        images = self.__fetch_images()
        current_research["images"] = images
        yield RunResponse(
            event="RESEARCH_IMAGES",
            content=json.dumps(images)
        )

        # update the session memory
        self.session_state["session"]["topic"] = topic
        self.session_state["session"]["research"] = current_research

        yield RunResponse(event=RunEvent.workflow_completed)
