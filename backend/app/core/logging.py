"""
Structured Enterprise Logging Configuration.
Provides centralized logging setup with colored levels and standard formats.
"""
import logging
import sys
from app.core.settings import settings


def setup_logging():
    log_level = logging.DEBUG if settings.DEBUG else logging.INFO
    
    formatter = logging.Formatter(
        fmt="%(asctime)s | %(levelname)-8s | %(name)s:%(funcName)s:%(lineno)d | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S"
    )

    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(formatter)

    root_logger = logging.getLogger()
    root_logger.setLevel(log_level)
    
    # Avoid duplicate handlers
    if not root_logger.handlers:
        root_logger.addHandler(handler)

    logger = logging.getLogger("ksp")
    logger.info(f"Logging initialized at level {'DEBUG' if settings.DEBUG else 'INFO'}")
    return logger
