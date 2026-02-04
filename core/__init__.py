"""
Sentinel OS v1.1 - Core Module
==============================
Multi-network logic, failover handlers, and RPC managers.

@module core
@version 1.1.0
"""

from .network_orchestrator import NetworkOrchestrator, RPCHealth, FailoverEvent
from .logger import Logger, LogLevel, get_logger

__all__ = [
    "NetworkOrchestrator",
    "RPCHealth",
    "FailoverEvent",
    "Logger",
    "LogLevel",
    "get_logger"
]

__version__ = "1.1.0"
