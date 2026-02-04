"""
Sentinel OS v1.1 - Structured Logger
====================================
Enterprise-grade logging that pipes to both UI and Opik traces.
Replaces all console.log statements with structured log entries.

@module core.logger
@version 1.1.0
@author PolarUniversal
"""

import time
import json
import hashlib
import secrets
from dataclasses import dataclass, field, asdict
from typing import Optional, Dict, Any, List, Callable
from enum import Enum
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

try:
    import opik
    from opik import track
    OPIK_AVAILABLE = True
except ImportError:
    OPIK_AVAILABLE = False
    def track(*args, **kwargs):
        def decorator(func):
            return func
        return decorator


class LogLevel(Enum):
    """
    Log severity levels following RFC 5424 syslog standard.
    
    @enum DEBUG: Detailed debugging information
    @enum INFO: Informational messages
    @enum WARN: Warning conditions
    @enum ERROR: Error conditions
    @enum CRITICAL: Critical conditions requiring immediate attention
    """
    DEBUG = "DEBUG"
    INFO = "INFO"
    WARN = "WARN"
    ERROR = "ERROR"
    CRITICAL = "CRITICAL"


@dataclass
class LogEntry:
    """
    Structured log entry for enterprise audit trails.
    
    @param log_id: Unique identifier for the log entry
    @param timestamp: Unix timestamp in milliseconds
    @param level: Log severity level
    @param module: Source module name
    @param message: Human-readable log message
    @param context: Additional structured context data
    @param trace_id: Opik trace correlation ID
    @param network: Associated network (if applicable)
    @param failover_event: Whether this is a failover-related log
    """
    log_id: str
    timestamp: int
    level: LogLevel
    module: str
    message: str
    context: Dict[str, Any] = field(default_factory=dict)
    trace_id: Optional[str] = None
    network: Optional[str] = None
    failover_event: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert log entry to dictionary for serialization.
        
        @returns Dict: Serializable dictionary representation
        """
        return {
            "log_id": self.log_id,
            "timestamp": self.timestamp,
            "level": self.level.value,
            "module": self.module,
            "message": self.message,
            "context": self.context,
            "trace_id": self.trace_id,
            "network": self.network,
            "failover_event": self.failover_event,
            "iso_time": datetime.fromtimestamp(self.timestamp / 1000).isoformat()
        }
    
    def to_json(self) -> str:
        """
        Serialize log entry to JSON string.
        
        @returns str: JSON representation
        """
        return json.dumps(self.to_dict(), default=str)


class Logger:
    """
    Enterprise Structured Logger with Opik Integration.
    
    Centralizes all logging across Sentinel OS modules.
    Pipes structured logs to:
    - In-memory buffer for UI consumption
    - Opik observability platform for distributed tracing
    - Optional file output for compliance audits
    
    Primary: In-memory + Opik traces
    Secondary: File-based logging fallback
    
    @example
        logger = Logger(module="PharmaModule")
        logger.info("Batch verified", {"batch_id": "B123", "count": 50})
        logger.warn("Approaching threshold", {"current": 95, "max": 100})
    """
    
    _instance: Optional['Logger'] = None
    _log_buffer: List[LogEntry] = []
    _ui_callbacks: List[Callable[[LogEntry], None]] = []
    _max_buffer_size: int = 10000
    
    def __init__(
        self,
        module: str = "Sentinel",
        min_level: LogLevel = LogLevel.DEBUG,
        opik_enabled: bool = True,
        file_path: Optional[str] = None
    ):
        """
        Initialize structured logger.
        
        @param module: Source module name for log entries
        @param min_level: Minimum log level to record
        @param opik_enabled: Whether to send logs to Opik
        @param file_path: Optional file path for log persistence
        """
        self._module = module
        self._min_level = min_level
        self._opik_enabled = opik_enabled and OPIK_AVAILABLE
        self._file_path = file_path
        self._trace_id = secrets.token_hex(16)
        
        if self._opik_enabled:
            try:
                opik.configure(
                    project_name="polar-grc-enterprise",
                    workspace="polar-universal"
                )
            except Exception:
                self._opik_enabled = False
    
    def _generate_log_id(self) -> str:
        """
        Generate unique log entry ID.
        
        @returns str: Unique identifier
        """
        return f"LOG-{secrets.token_hex(8).upper()}"
    
    def _should_log(self, level: LogLevel) -> bool:
        """
        Check if log level meets minimum threshold.
        
        @param level: Log level to check
        @returns bool: Whether to log this entry
        """
        levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.CRITICAL]
        return levels.index(level) >= levels.index(self._min_level)
    
    def _create_entry(
        self,
        level: LogLevel,
        message: str,
        context: Optional[Dict[str, Any]] = None,
        network: Optional[str] = None,
        failover_event: bool = False
    ) -> LogEntry:
        """
        Create a structured log entry.
        
        @param level: Log severity level
        @param message: Log message
        @param context: Additional context data
        @param network: Associated network
        @param failover_event: Whether failover-related
        @returns LogEntry: The structured log entry
        """
        return LogEntry(
            log_id=self._generate_log_id(),
            timestamp=int(time.time() * 1000),
            level=level,
            module=self._module,
            message=message,
            context=context or {},
            trace_id=self._trace_id,
            network=network,
            failover_event=failover_event
        )
    
    def _emit(self, entry: LogEntry) -> None:
        """
        Emit log entry to all configured destinations.
        
        Primary: In-memory buffer + Opik traces
        Secondary: File-based persistence
        
        @param entry: Log entry to emit
        """
        # Add to buffer
        Logger._log_buffer.append(entry)
        if len(Logger._log_buffer) > self._max_buffer_size:
            Logger._log_buffer = Logger._log_buffer[-self._max_buffer_size:]
        
        # Notify UI callbacks
        for callback in Logger._ui_callbacks:
            try:
                callback(entry)
            except Exception:
                pass
        
        # Send to Opik if enabled
        if self._opik_enabled:
            try:
                opik.track_event(
                    name=f"log_{entry.level.value.lower()}",
                    input={"message": entry.message, "module": entry.module},
                    output=entry.context,
                    metadata={
                        "log_id": entry.log_id,
                        "network": entry.network,
                        "failover_event": entry.failover_event
                    }
                )
            except Exception:
                pass
        
        # Write to file if configured
        if self._file_path:
            try:
                with open(self._file_path, 'a') as f:
                    f.write(entry.to_json() + "\n")
            except Exception:
                pass
    
    def debug(self, message: str, context: Optional[Dict[str, Any]] = None, **kwargs) -> None:
        """
        Log debug-level message.
        
        @param message: Log message
        @param context: Additional context
        """
        if self._should_log(LogLevel.DEBUG):
            entry = self._create_entry(LogLevel.DEBUG, message, context, **kwargs)
            self._emit(entry)
    
    def info(self, message: str, context: Optional[Dict[str, Any]] = None, **kwargs) -> None:
        """
        Log info-level message.
        
        @param message: Log message
        @param context: Additional context
        """
        if self._should_log(LogLevel.INFO):
            entry = self._create_entry(LogLevel.INFO, message, context, **kwargs)
            self._emit(entry)
    
    def warn(self, message: str, context: Optional[Dict[str, Any]] = None, **kwargs) -> None:
        """
        Log warning-level message.
        
        @param message: Log message
        @param context: Additional context
        """
        if self._should_log(LogLevel.WARN):
            entry = self._create_entry(LogLevel.WARN, message, context, **kwargs)
            self._emit(entry)
    
    def error(self, message: str, context: Optional[Dict[str, Any]] = None, **kwargs) -> None:
        """
        Log error-level message.
        
        @param message: Log message
        @param context: Additional context
        """
        if self._should_log(LogLevel.ERROR):
            entry = self._create_entry(LogLevel.ERROR, message, context, **kwargs)
            self._emit(entry)
    
    def critical(self, message: str, context: Optional[Dict[str, Any]] = None, **kwargs) -> None:
        """
        Log critical-level message.
        
        @param message: Log message
        @param context: Additional context
        """
        if self._should_log(LogLevel.CRITICAL):
            entry = self._create_entry(LogLevel.CRITICAL, message, context, **kwargs)
            self._emit(entry)
    
    def failover(
        self,
        from_network: str,
        to_network: str,
        reason: str,
        latency_ms: float
    ) -> None:
        """
        Log a failover event with structured context.
        
        @param from_network: Source network that failed
        @param to_network: Target network for failover
        @param reason: Reason for failover
        @param latency_ms: Failover latency in milliseconds
        """
        context = {
            "from_network": from_network,
            "to_network": to_network,
            "reason": reason,
            "latency_ms": latency_ms,
            "compliant": latency_ms < 200
        }
        entry = self._create_entry(
            LogLevel.WARN,
            f"Failover: {from_network} -> {to_network}",
            context,
            network=to_network,
            failover_event=True
        )
        self._emit(entry)
    
    @classmethod
    def register_ui_callback(cls, callback: Callable[[LogEntry], None]) -> None:
        """
        Register a callback for UI log streaming.
        
        @param callback: Function to call with each log entry
        """
        cls._ui_callbacks.append(callback)
    
    @classmethod
    def get_recent_logs(cls, count: int = 100, level: Optional[LogLevel] = None) -> List[Dict]:
        """
        Get recent log entries for UI display.
        
        @param count: Number of entries to return
        @param level: Optional filter by level
        @returns List[Dict]: Recent log entries
        """
        logs = cls._log_buffer[-count:]
        if level:
            logs = [l for l in logs if l.level == level]
        return [l.to_dict() for l in logs]
    
    @classmethod
    def get_failover_events(cls) -> List[Dict]:
        """
        Get all failover events for compliance reporting.
        
        @returns List[Dict]: Failover event logs
        """
        return [l.to_dict() for l in cls._log_buffer if l.failover_event]


# Module-level logger factory
_loggers: Dict[str, Logger] = {}


def get_logger(module: str = "Sentinel") -> Logger:
    """
    Get or create a logger instance for a module.
    
    @param module: Module name for the logger
    @returns Logger: Logger instance
    """
    if module not in _loggers:
        _loggers[module] = Logger(module=module)
    return _loggers[module]
