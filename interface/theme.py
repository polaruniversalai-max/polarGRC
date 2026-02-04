"""
Sentinel OS v1.1 - Theme Constants
==================================
Centralized theme configuration for terminal and UI output.

@module interface.theme
@version 1.1.0
@author PolarUniversal

DESIGN SYSTEM:
- Primary: Ultra-dark institutional theme
- Accent: Neon Emerald (#10B981) for success/compliance
- Warning: Gold (#F59E0B) for caution
- Error: Red (#EF4444) for failures
"""

from typing import Dict, Any
from enum import Enum


class StatusLevel(Enum):
    """
    Status levels for UI display.
    
    @enum SUCCESS: Green/compliant
    @enum WARNING: Yellow/caution
    @enum ERROR: Red/failure
    @enum INFO: Blue/informational
    @enum NEUTRAL: Gray/inactive
    """
    SUCCESS = "success"
    WARNING = "warning"
    ERROR = "error"
    INFO = "info"
    NEUTRAL = "neutral"


# =============================================================================
# ANSI TERMINAL COLOR CODES
# =============================================================================

TERMINAL_COLORS: Dict[str, str] = {
    "EMERALD": "\033[38;5;48m",      # Neon emerald green
    "GOLD": "\033[38;5;220m",         # Warning gold
    "RED": "\033[38;5;196m",          # Error red
    "BLUE": "\033[38;5;75m",          # Info blue
    "CYAN": "\033[38;5;51m",          # Accent cyan
    "PURPLE": "\033[38;5;141m",       # Highlight purple
    "GRAY": "\033[38;5;245m",         # Muted gray
    "WHITE": "\033[38;5;255m",        # Bright white
    "DIM": "\033[38;5;240m",          # Dim text
    "RESET": "\033[0m",               # Reset to default
    "BOLD": "\033[1m",                # Bold text
    "UNDERLINE": "\033[4m",           # Underlined text
}


# =============================================================================
# THEME COLOR PALETTE (HSL VALUES FOR CSS)
# =============================================================================

THEME_COLORS: Dict[str, Dict[str, Any]] = {
    "background": {
        "primary": "222 47% 5%",       # Ultra-dark charcoal
        "secondary": "222 47% 8%",      # Slightly lighter
        "tertiary": "222 47% 11%",      # Card backgrounds
    },
    "foreground": {
        "primary": "0 0% 98%",          # Near-white text
        "secondary": "240 5% 64%",      # Muted text
        "tertiary": "240 5% 45%",       # Dim text
    },
    "accent": {
        "emerald": "160 84% 39%",       # Neon emerald (#10B981)
        "gold": "38 92% 50%",           # Warning gold (#F59E0B)
        "red": "0 84% 60%",             # Error red (#EF4444)
        "blue": "217 91% 60%",          # Info blue (#3B82F6)
        "purple": "263 70% 50%",        # Highlight purple (#8B5CF6)
        "cyan": "186 100% 50%",         # Accent cyan (#00D4FF)
    },
    "border": {
        "default": "240 3.7% 15.9%",    # Subtle border
        "accent": "160 84% 39%",         # Emerald border
    }
}


# =============================================================================
# STATUS COLOR MAPPING
# =============================================================================

STATUS_COLORS: Dict[StatusLevel, str] = {
    StatusLevel.SUCCESS: TERMINAL_COLORS["EMERALD"],
    StatusLevel.WARNING: TERMINAL_COLORS["GOLD"],
    StatusLevel.ERROR: TERMINAL_COLORS["RED"],
    StatusLevel.INFO: TERMINAL_COLORS["BLUE"],
    StatusLevel.NEUTRAL: TERMINAL_COLORS["GRAY"],
}


def get_status_color(status: StatusLevel) -> str:
    """
    Get ANSI color code for status level.
    
    @param status: Status level enum
    @returns str: ANSI color escape code
    """
    return STATUS_COLORS.get(status, TERMINAL_COLORS["RESET"])


def format_terminal_output(
    message: str,
    status: StatusLevel = StatusLevel.NEUTRAL,
    prefix: str = "",
    bold: bool = False
) -> str:
    """
    Format message with terminal colors.
    
    @param message: Message to format
    @param status: Status level for coloring
    @param prefix: Optional prefix (e.g., "[INFO]")
    @param bold: Whether to bold the text
    @returns str: Formatted terminal string
    """
    color = get_status_color(status)
    reset = TERMINAL_COLORS["RESET"]
    bold_code = TERMINAL_COLORS["BOLD"] if bold else ""
    
    if prefix:
        return f"{bold_code}{color}[{prefix}]{reset} {message}"
    return f"{bold_code}{color}{message}{reset}"


def print_section_header(title: str, width: int = 70) -> str:
    """
    Generate a section header for terminal output.
    
    @param title: Section title
    @param width: Header width in characters
    @returns str: Formatted header string
    """
    gold = TERMINAL_COLORS["GOLD"]
    reset = TERMINAL_COLORS["RESET"]
    border = "═" * width
    
    return f"\n{gold}{border}\n  {title}\n{border}{reset}"


def print_result(label: str, data: Dict[str, Any]) -> str:
    """
    Format a result dictionary for terminal display.
    
    @param label: Result label
    @param data: Data dictionary to display
    @returns str: Formatted result string
    """
    emerald = TERMINAL_COLORS["EMERALD"]
    gray = TERMINAL_COLORS["GRAY"]
    reset = TERMINAL_COLORS["RESET"]
    
    lines = [f"  {emerald}{label}:{reset}"]
    for key, value in data.items():
        lines.append(f"    {gray}{key}:{reset} {value}")
    
    return "\n".join(lines)
