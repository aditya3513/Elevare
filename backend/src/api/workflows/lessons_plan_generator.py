import json
from agno.agent import Agent
from agno.workflow import Workflow, RunResponse, RunEvent
from agno.utils.log import logger
from src.agents import lesson_planner
from src.agents import confirmation_message_generator
from src.agents.json_extractor import init_agent
from typing import Iterator, List, Dict

class LessonsPlanGenerator(Workflow):
    # create base voice agent for feedback
    confirmation_agent: Agent = confirmation_message_generator.agent
    lesson_planning_agent: Agent = lesson_planner.agent
    extraction_agent: Agent = init_agent(output_model=lesson_planner.Lessons)

    custom_events = [
        "AUDIO_TRANSCRIPT", 
        "WHITEBOARD_RESET",
        "WHITEBOARD_UPDATE"]
    
    def __generate_whiteboard_state_lessons(lessons_obj: lesson_planner.Lessons) -> List[Dict]:
        items = []
        
        # Set initial positions and spacing parameters
        base_x = 50
        base_y = 50
        lesson_gap_y = 300      # vertical gap between lesson plans
        subtopic_gap_y = 150    # vertical gap between subtopic boxes within the same lesson
        lesson_box_width = 600
        lesson_box_height = 200
        subtopic_box_width = 400
        subtopic_box_height = 140
        subtopic_x_offset = base_x + lesson_box_width + 20  # position subtopic boxes to the right of lesson box

        # Loop over each lesson plan
        for lesson_index, lesson in enumerate(lessons_obj.lessons):
            lesson_y = base_y + lesson_index * lesson_gap_y

            # Create a box for the LessonPlan
            lesson_box = {
                "type": "box",
                "title": lesson.title,
                "contents": [
                    {"type": "text", "text": lesson.description},
                    {"type": "text", "text": "Objectives:"},
                ] + [{"type": "sticky", "text": f"- {obj}"} for obj in lesson.learning_objectives] + [
                    {"type": "text", "text": "Introduction:"},
                    {"type": "sticky", "text": lesson.lesson_introduction},
                ],
                "position": {"x": base_x, "y": lesson_y},
                "size": {"width": lesson_box_width, "height": lesson_box_height}
            }
            items.append(lesson_box)

            # For each subtopic in the lesson plan, create a subtopic box
            for sub_index, sub in enumerate(lesson.sub_topics):
                subtopic_y = lesson_y + sub_index * subtopic_gap_y

                # Build contents for the subtopic box
                sub_contents = [{"type": "sticky", "text": sub.brief_summary}]
                if sub.analogies:
                    sub_contents.append({"type": "sticky", "text": f"Analogies: {sub.analogies}"})
                if sub.real_world_applications:
                    sub_contents.append({"type": "sticky", "text": "Real-world Applications:"})
                    for app in sub.real_world_applications:
                        sub_contents.append({"type": "sticky", "text": f"- {app}"})
                
                subtopic_box = {
                    "type": "box",
                    "title": sub.title,
                    "contents": sub_contents,
                    "position": {"x": subtopic_x_offset, "y": subtopic_y},
                    "size": {"width": subtopic_box_width, "height": subtopic_box_height}
                }
                items.append(subtopic_box)
        
        return items

    def __generate_lessons_plan_md(self, topic: str) -> str:
        logger.info("lessons Plan Generation Started (Attempt 1)...")
        lessons_plan_md = self.lesson_planning_agent.run(topic).content
        logger.info("lessons Plan Generation Finished...")
        return lessons_plan_md
    
    def __generate_confirmation_msg(self, topic: str) -> str:
        logger.info("Confirmation Msg Generation Started (Attempt 1)...")
        confirmation_msg_response = self.confirmation_agent.run(topic)
        logger.info("Confirmation Msg Generation Finished...")
        return confirmation_msg_response.content

    def run(self) -> Iterator[RunResponse]:
        # init study plan
        lessons_plan = {}
        # fetch current research data
        research_report = self.session_state["session"]["research"]["report"]

        lessons_plan_md = self.__generate_lessons_plan_md(topic=f"{research_report}")
        lessons_plan["markdown"] = lessons_plan_md
        
        confirmation_msg = self.__generate_confirmation_msg(f"""Generate a fiendly message walking user through the study plan for lessons:
            {lessons_plan_md}""")
        
        lessons_plan["confirmation"] = confirmation_msg
        yield RunResponse(
            event="AUDIO_TRANSCRIPT",
            content=confirmation_msg
        )

        yield RunResponse(
            event="WHITEBOARD_RESET",
            content=json.dumps({})
        )

        # parse report inso json format
        parsed_lessons = self.extraction_agent.run(lessons_plan_md).content
        lessons_plan["parsed_data"] = parsed_lessons
        
        self.session_state["session"]["lessons"] = lessons_plan

        tl_draw_items = self.__generate_whiteboard_state_lessons(parsed_lessons)

        yield RunResponse(
            event="WHITEBOARD_UPDATE",
            content=json.dumps(tl_draw_items)
        )


        yield RunResponse(event=RunEvent.workflow_completed)
