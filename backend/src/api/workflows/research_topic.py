import json
from agno.agent import Agent
from agno.workflow import Workflow, RunResponse, RunEvent
from agno.utils.log import logger
from src.agents import confirmation_message_generator
from gpt_researcher import GPTResearcher
from src.agents.json_extractor import init_agent
from pydantic import BaseModel
from typing import List, Dict, Optional, Iterator


class Introduction(BaseModel):
    background: str
    objective: str

class Content(BaseModel):
    key_points: List[str]
    steps: List[str]

class Conclusion(BaseModel):
    summary: str
    next_steps: Optional[str] = None

class Report(BaseModel):
    title: str
    abstract: str
    introduction: Introduction
    content: Content
    conclusion: Conclusion
    references: List[str]

class DeepResearcher(Workflow):
    # create base voice agent for feedback
    confirmation_agent: Agent = confirmation_message_generator.agent
    extraction_agent: Agent = init_agent(output_model=Report)
    custom_events = [
        "RESEARCH_REPORT", 
        "AUDIO_TRANSCRIPT", 
        "RESEARCH_CONTEXT", 
        "RESEARCH_SOURCES", 
        "RESEARCH_IMAGES",
        "WHITEBOARD_RESET",
        "WHITEBOARD_UPDATE"]

    def __generate_tldraw_items(self, report: Report) -> List[Dict]:
        items = []
        
        # Title: Render as a large header element.
        title_item = {
            "type": "header",
            "text": report.title,
            "position": {"x": 50, "y": 50},
            "size": {"width": 400, "height": 60}
        }
        items.append(title_item)
        
        # Abstract/Description: Render as a description text box.
        abstract_item = {
            "type": "textbox",
            "text": report.abstract,
            "position": {"x": 50, "y": 120},
            "size": {"width": 400, "height": 80}
        }
        items.append(abstract_item)
        
        # Introduction: Render as a box with sticky note sub-elements.
        intro_item = {
            "type": "box",
            "title": "Introduction",
            "contents": [
                {"type": "sticky", "text": f"Background: {report.introduction.background}"},
                {"type": "sticky", "text": f"Objective: {report.introduction.objective}"}
            ],
            "position": {"x": 500, "y": 50},
            "size": {"width": 350, "height": 120}
        }
        items.append(intro_item)
        
        # Content: Render key points and steps as sticky notes within a box.
        content_item = {
            "type": "box",
            "title": "Content",
            "contents": (
                [{"type": "sticky", "text": "Key Points:"}] +
                [{"type": "sticky", "text": kp} for kp in report.content.key_points] +
                [{"type": "sticky", "text": "Steps:"}] +
                [{"type": "sticky", "text": step} for step in report.content.steps]
            ),
            "position": {"x": 50, "y": 220},
            "size": {"width": 400, "height": 200}
        }
        items.append(content_item)
        
        # Conclusion: Render summary and next steps as a single sticky inside a box.
        conclusion_text = f"Summary: {report.conclusion.summary}"
        if report.conclusion.next_steps:
            conclusion_text += f"\nNext Steps: {report.conclusion.next_steps}"
        conclusion_item = {
            "type": "box",
            "title": "Conclusion",
            "contents": [{"type": "sticky", "text": conclusion_text}],
            "position": {"x": 500, "y": 220},
            "size": {"width": 350, "height": 120}
        }
        items.append(conclusion_item)
        
        # References: Render as a side box.
        references_text = "\n".join(report.references)
        references_item = {
            "type": "box",
            "title": "References",
            "contents": [{"type": "sticky", "text": references_text}],
            "position": {"x": 900, "y": 50},
            "size": {"width": 250, "height": 300}
        }
        items.append(references_item)
        
        return items
        
    def __fetch_images(self):
        images = self.researcher.get_research_images()
        return images
    
    def __fetch_sources(self):
        sources = self.researcher.get_research_sources()
        return sources
    
    def __fetch_research_context(self):
        context = self.researcher.get_research_context()
        return context
    
    def get_current_state(self):
        current_research = self.session_state["session"].get("research",  None)
        return current_research

    
    def __generate_confirmation_msg(self, topic: str) -> str:
        logger.info("Confirmation Msg Generation Started (Attempt 1)...")
        confirmation_msg_response = self.confirmation_agent.run(topic)
        logger.info("Confirmation Msg Generation Finished...")
        return confirmation_msg_response.content

    def run(self, topic: str, researcher: GPTResearcher, report) -> Iterator[RunResponse]:
        # if sessiond oes not exist end workflow
        if not self.session_state.get("session", None):
            yield RunResponse(event=RunEvent.workflow_completed)
            return
        # init research state
        current_research = self.session_state["session"].get("research",  {})
        self.researcher = researcher
        
        # init report state
        current_research["report"] = report
        yield RunResponse(
            event="RESEARCH_REPORT",
            content=json.dumps(report)
        )
        
        if current_research.get("report_summary", None):
            resport_gen_msg = current_research["report_summary"]
        else:
            resport_gen_msg = self.__generate_confirmation_msg(f"Write a short 100 word summary for the report. Report: {report}")
            current_research["report_summary"] = resport_gen_msg
        # send report summary for voice
        yield RunResponse(
            event="AUDIO_TRANSCRIPT",
            content=resport_gen_msg
        )
        
        # fetch context
        if current_research.get("context", None):
            context = current_research["context"]
        else:
            context = self.__fetch_research_context()
            current_research["context"] = context
        yield RunResponse(
            event="RESEARCH_CONTEXT",
            content=json.dumps(context)
        )

        # fetch sources
        if current_research.get("sources", None):
            sources = current_research["sources"]
        else:
            sources = self.__fetch_sources()
            current_research["sources"] = sources
        yield RunResponse(
            event="RESEARCH_SOURCES",
            content=json.dumps(sources)
        )

        # fetch images
        if current_research.get("images", None):
            images = current_research["images"]
        else:
            images = self.__fetch_images()
            current_research["images"] = images
        
        yield RunResponse(
            event="RESEARCH_IMAGES",
            content=json.dumps(images)
        )

        # update the session memory
        self.session_state["session"]["topic"] = topic
        self.session_state["session"]["research"] = current_research
        self.write_to_storage()

        yield RunResponse(
            event="WHITEBOARD_RESET",
            content=json.dumps({})
        )

        if current_research.get("parsed_data", None):
            json_report = current_research["parsed_data"]
        else:
            # parse report inso json format
            json_report = self.extraction_agent.run(report)
            self.session_state["session"]["research"]["parsed_data"] = json_report
            self.write_to_storage()

        tl_draw_items = self.__generate_tldraw_items()

        yield RunResponse(
            event="WHITEBOARD_UPDATE",
            content=json.dumps(tl_draw_items)
        )


        yield RunResponse(event=RunEvent.workflow_completed)
