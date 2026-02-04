"""
Sentinel OS v1.1 - Opik Observability Service
=============================================
API connector for Opik distributed tracing and observability.

@module services.opik_service
@version 1.1.0
@author PolarUniversal

FAILOVER LOGIC:
- Primary: Opik API with full tracing
- Secondary: Local log aggregation fallback
"""

import asyncio
import time
import hashlib
import secrets
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from config.settings import get_settings
from core.logger import get_logger

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


@dataclass
class TraceSpan:
    """
    Observability trace span.
    
    @param span_id: Unique span identifier
    @param trace_id: Parent trace identifier
    @param operation: Operation name
    @param start_time: Span start timestamp
    @param end_time: Span end timestamp
    @param metadata: Span metadata
    """
    span_id: str
    trace_id: str
    operation: str
    start_time: int
    end_time: Optional[int] = None
    metadata: Dict[str, Any] = field(default_factory=dict)
    status: str = "in_progress"


class OpikService:
    """
    Opik Observability Service Connector.
    
    Provides distributed tracing and resilience event logging.
    Used for compliance audit trails and performance monitoring.
    
    Primary: Opik API (comet.com/opik)
    Secondary: Local JSON log aggregation
    
    @example
        service = OpikService()
        trace_id = service.start_trace("verify_batch")
        # ... operation ...
        service.end_trace(trace_id, {"batch_id": "B123"})
    """
    
    DASHBOARD_URL = "https://www.comet.com/opik/polar-universal/home"
    PROJECT_NAME = "polar-grc-enterprise"
    
    def __init__(self):
        """
        Initialize Opik service with configuration.
        """
        self._logger = get_logger("OpikService")
        self._settings = get_settings()
        self._traces: Dict[str, TraceSpan] = {}
        self._resilience_events: List[Dict] = []
        self._initialized = False
        
        self._initialize_opik()
    
    def _initialize_opik(self) -> None:
        """
        Initialize Opik SDK connection.
        
        Primary: SDK initialization with API key
        Secondary: Disabled mode with local logging
        """
        if not OPIK_AVAILABLE:
            self._logger.warn("Opik SDK not available, using local logging")
            return
        
        try:
            opik.configure(
                project_name=self.PROJECT_NAME,
                workspace="polar-universal"
            )
            self._initialized = True
            self._logger.info("Opik initialized", {
                "project": self.PROJECT_NAME,
                "dashboard": self.DASHBOARD_URL
            })
        except Exception as e:
            self._logger.error("Opik initialization failed", {"error": str(e)})
    
    def start_trace(
        self,
        operation: str,
        metadata: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Start a new trace span.
        
        @param operation: Operation name being traced
        @param metadata: Initial span metadata
        @returns str: Trace ID
        """
        trace_id = f"TRACE-{secrets.token_hex(12)}"
        span_id = f"SPAN-{secrets.token_hex(8)}"
        
        span = TraceSpan(
            span_id=span_id,
            trace_id=trace_id,
            operation=operation,
            start_time=int(time.time() * 1000),
            metadata=metadata or {}
        )
        self._traces[trace_id] = span
        
        self._logger.debug(f"Started trace: {operation}", {
            "trace_id": trace_id
        })
        
        return trace_id
    
    def end_trace(
        self,
        trace_id: str,
        result: Optional[Dict[str, Any]] = None,
        status: str = "completed"
    ) -> Optional[Dict[str, Any]]:
        """
        End a trace span and record results.
        
        @param trace_id: Trace ID to end
        @param result: Operation result data
        @param status: Final status (completed, failed, etc.)
        @returns Dict: Final trace data
        """
        span = self._traces.get(trace_id)
        if not span:
            return None
        
        span.end_time = int(time.time() * 1000)
        span.status = status
        if result:
            span.metadata.update(result)
        
        duration_ms = span.end_time - span.start_time
        
        # Log to Opik if available
        if self._initialized and OPIK_AVAILABLE:
            try:
                opik.track_event(
                    name=span.operation,
                    input={"trace_id": trace_id},
                    output=span.metadata,
                    metadata={
                        "duration_ms": duration_ms,
                        "status": status
                    }
                )
            except Exception:
                pass
        
        self._logger.debug(f"Ended trace: {span.operation}", {
            "trace_id": trace_id,
            "duration_ms": duration_ms,
            "status": status
        })
        
        return {
            "trace_id": trace_id,
            "operation": span.operation,
            "duration_ms": duration_ms,
            "status": status,
            "metadata": span.metadata
        }
    
    def log_resilience_event(
        self,
        event_type: str,
        from_network: str,
        to_network: str,
        latency_ms: float,
        success: bool
    ) -> str:
        """
        Log a resilience/failover event for compliance.
        
        @param event_type: Type of resilience event
        @param from_network: Source network
        @param to_network: Target network
        @param latency_ms: Event latency
        @param success: Whether event was successful
        @returns str: Event ID
        """
        event_id = f"RES-{secrets.token_hex(8).upper()}"
        
        event = {
            "event_id": event_id,
            "event_type": event_type,
            "from_network": from_network,
            "to_network": to_network,
            "latency_ms": round(latency_ms, 2),
            "success": success,
            "compliant": latency_ms < 200,
            "timestamp": int(time.time() * 1000)
        }
        self._resilience_events.append(event)
        
        # Log to Opik
        if self._initialized and OPIK_AVAILABLE:
            try:
                opik.track_event(
                    name="resilience_event",
                    input={"from": from_network, "to": to_network},
                    output={"success": success, "latency_ms": latency_ms},
                    metadata={"event_type": event_type}
                )
            except Exception:
                pass
        
        self._logger.info("Resilience event logged", event)
        
        return event_id
    
    def get_resilience_events(self) -> List[Dict]:
        """
        Get all resilience events for compliance reporting.
        
        @returns List[Dict]: Resilience events
        """
        return self._resilience_events
    
    def get_dashboard_url(self) -> str:
        """
        Get Opik dashboard URL.
        
        @returns str: Dashboard URL
        """
        return self.DASHBOARD_URL
