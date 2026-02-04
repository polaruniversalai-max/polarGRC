"""
Sentinel OS v1.1 - Interface Module
===================================
Mobile-responsive UI components and theme constants.

@module interface
@version 1.1.0
"""

from .theme import (
    THEME_COLORS,
    TERMINAL_COLORS,
    STATUS_COLORS,
    get_status_color,
    format_terminal_output
)

__all__ = [
    "THEME_COLORS",
    "TERMINAL_COLORS", 
    "STATUS_COLORS",
    "get_status_color",
    "format_terminal_output"
]

__version__ = "1.1.0"
