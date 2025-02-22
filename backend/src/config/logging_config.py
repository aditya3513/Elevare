import logging

# Set up logging
logger = logging.getLogger("websocket")
logger.setLevel(logging.INFO)
__handler = logging.StreamHandler()
__formatter = logging.Formatter("[%(asctime)s] %(levelname)s in %(module)s: %(message)s")
__handler.setFormatter(__formatter)
logger.addHandler(__handler)