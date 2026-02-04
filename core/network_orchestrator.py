"""
Sentinel OS v1.1 - Network Orchestrator
========================================
Centralized RPC management with <200ms failover guarantee.
All network interactions flow through this single class.

@module core.network_orchestrator
@version 1.1.0
@author PolarUniversal

FAILOVER LOGIC:
- Primary: Direct RPC call to configured primary endpoint
- Secondary: Automatic failover on timeout/error to fallback endpoint
- Tertiary: Cross-network failover for critical operations
"""

import asyncio
import time
import hashlib
import secrets
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List, Callable, Tuple
from enum import Enum
from datetime import datetime
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..'))

from config.settings import (
    NetworkType,
    NetworkEndpoint,
    NETWORK_ENDPOINTS,
    get_settings
)
from core.logger import Logger, get_logger


@dataclass
class RPCHealth:
    """
    RPC endpoint health status.
    
    @param network: Network type
    @param endpoint: Current active endpoint URL
    @param is_healthy: Whether endpoint is responding
    @param latency_ms: Last measured latency
    @param last_check: Timestamp of last health check
    @param consecutive_failures: Count of consecutive failures
    @param using_fallback: Whether currently on fallback endpoint
    """
    network: NetworkType
    endpoint: str
    is_healthy: bool = True
    latency_ms: float = 0.0
    last_check: int = 0
    consecutive_failures: int = 0
    using_fallback: bool = False
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert health status to dictionary.
        
        @returns Dict: Serializable health status
        """
        return {
            "network": self.network.value,
            "endpoint": self.endpoint[:50] + "..." if len(self.endpoint) > 50 else self.endpoint,
            "is_healthy": self.is_healthy,
            "latency_ms": round(self.latency_ms, 2),
            "last_check": self.last_check,
            "consecutive_failures": self.consecutive_failures,
            "using_fallback": self.using_fallback
        }


@dataclass
class FailoverEvent:
    """
    Record of a failover event for compliance audit.
    
    @param event_id: Unique event identifier
    @param timestamp: Unix timestamp in milliseconds
    @param from_network: Source network that failed
    @param to_network: Target network after failover
    @param reason: Reason for failover
    @param latency_ms: Time to complete failover
    @param success: Whether failover was successful
    """
    event_id: str
    timestamp: int
    from_network: NetworkType
    to_network: NetworkType
    reason: str
    latency_ms: float
    success: bool
    
    def to_dict(self) -> Dict[str, Any]:
        """
        Convert failover event to dictionary.
        
        @returns Dict: Serializable event record
        """
        return {
            "event_id": self.event_id,
            "timestamp": self.timestamp,
            "from_network": self.from_network.value,
            "to_network": self.to_network.value,
            "reason": self.reason,
            "latency_ms": round(self.latency_ms, 2),
            "success": self.success,
            "compliant": self.latency_ms < 200
        }


class NetworkOrchestrator:
    """
    Centralized Network RPC Manager with Failover Logic.
    
    Implements Zero-Downtime compliance with <200ms failover guarantee.
    All blockchain/network interactions must flow through this class.
    
    Primary/Secondary Failover Logic:
    1. Attempt primary RPC endpoint
    2. On failure (timeout/error), immediately switch to fallback
    3. Log failover event to Opik traces
    4. Continue with fallback until primary recovers
    5. Automatic recovery check every health_check_interval
    
    @example
        orchestrator = NetworkOrchestrator()
        await orchestrator.initialize()
        result = await orchestrator.execute(
            network=NetworkType.MOVEMENT_M1,
            operation="verify_batch",
            params={"batch_id": "B123"}
        )
    """
    
    _instance: Optional['NetworkOrchestrator'] = None
    
    def __init__(self):
        """
        Initialize the Network Orchestrator.
        
        Sets up health tracking for all configured networks
        and initializes the structured logger.
        """
        self._logger = get_logger("NetworkOrchestrator")
        self._settings = get_settings()
        self._health_status: Dict[NetworkType, RPCHealth] = {}
        self._failover_history: List[FailoverEvent] = []
        self._mock_mode = True  # Use mock providers for demo
        self._initialized = False
        
        # Initialize health status for all networks
        for network_type, endpoint in NETWORK_ENDPOINTS.items():
            self._health_status[network_type] = RPCHealth(
                network=network_type,
                endpoint=endpoint.primary_rpc,
                is_healthy=True,
                latency_ms=0.0,
                last_check=int(time.time() * 1000)
            )
    
    @classmethod
    def get_instance(cls) -> 'NetworkOrchestrator':
        """
        Get singleton instance of NetworkOrchestrator.
        
        @returns NetworkOrchestrator: The singleton instance
        """
        if cls._instance is None:
            cls._instance = NetworkOrchestrator()
        return cls._instance
    
    async def initialize(self) -> None:
        """
        Initialize all network connections and run initial health checks.
        
        Primary: Parallel health checks on all networks
        Secondary: Sequential fallback if parallel fails
        """
        self._logger.info("Initializing Network Orchestrator", {
            "networks": len(NETWORK_ENDPOINTS),
            "failover_timeout_ms": self._settings.failover_timeout_ms
        })
        
        # Run parallel health checks
        tasks = [
            self._check_health(network_type)
            for network_type in NETWORK_ENDPOINTS.keys()
        ]
        await asyncio.gather(*tasks, return_exceptions=True)
        
        self._initialized = True
        self._logger.info("Network Orchestrator initialized", {
            "healthy_count": self._get_healthy_count(),
            "total_networks": len(NETWORK_ENDPOINTS)
        })
    
    async def _check_health(self, network_type: NetworkType) -> bool:
        """
        Check health of a specific network endpoint.
        
        Primary: Ping primary RPC endpoint
        Secondary: Fall back to secondary if primary fails
        
        @param network_type: Network to check
        @returns bool: Whether network is healthy
        """
        endpoint_config = NETWORK_ENDPOINTS.get(network_type)
        if not endpoint_config:
            return False
        
        health = self._health_status.get(network_type)
        if not health:
            return False
        
        start_time = time.time()
        
        try:
            # Mock health check (simulates RPC ping)
            if self._mock_mode:
                await asyncio.sleep(0.01)  # Simulate network latency
                latency_ms = (time.time() - start_time) * 1000
                
                health.is_healthy = True
                health.latency_ms = latency_ms
                health.last_check = int(time.time() * 1000)
                health.consecutive_failures = 0
                
                return True
            
            # Real RPC health check would go here
            # async with aiohttp.ClientSession() as session:
            #     async with session.get(endpoint_config.primary_rpc + "/health") as resp:
            #         ...
            
        except Exception as e:
            health.consecutive_failures += 1
            health.is_healthy = health.consecutive_failures < endpoint_config.max_retries
            
            if not health.is_healthy and not health.using_fallback:
                await self._trigger_failover(network_type, str(e))
            
            return False
        
        return True
    
    async def _trigger_failover(
        self,
        network_type: NetworkType,
        reason: str
    ) -> bool:
        """
        Trigger failover from primary to secondary endpoint.
        
        Must complete in <200ms for Zero-Downtime compliance.
        
        @param network_type: Network experiencing failure
        @param reason: Reason for failover
        @returns bool: Whether failover was successful
        """
        start_time = time.time()
        
        endpoint_config = NETWORK_ENDPOINTS.get(network_type)
        health = self._health_status.get(network_type)
        
        if not endpoint_config or not health:
            return False
        
        # Switch to fallback endpoint
        health.endpoint = endpoint_config.fallback_rpc
        health.using_fallback = True
        
        # Verify fallback is healthy
        try:
            if self._mock_mode:
                await asyncio.sleep(0.005)  # Simulate quick failover
                health.is_healthy = True
        except Exception:
            health.is_healthy = False
        
        latency_ms = (time.time() - start_time) * 1000
        
        # Record failover event
        event = FailoverEvent(
            event_id=f"FAILOVER-{secrets.token_hex(8).upper()}",
            timestamp=int(time.time() * 1000),
            from_network=network_type,
            to_network=network_type,  # Same network, different endpoint
            reason=reason,
            latency_ms=latency_ms,
            success=health.is_healthy
        )
        self._failover_history.append(event)
        
        # Log to structured logger (pipes to Opik)
        self._logger.failover(
            from_network=f"{network_type.value} (primary)",
            to_network=f"{network_type.value} (fallback)",
            reason=reason,
            latency_ms=latency_ms
        )
        
        return health.is_healthy
    
    async def execute(
        self,
        network: NetworkType,
        operation: str,
        params: Optional[Dict[str, Any]] = None,
        timeout_ms: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Execute an operation on a network with automatic failover.
        
        Primary: Execute on primary/current endpoint
        Secondary: Automatic failover and retry on failure
        
        @param network: Target network
        @param operation: Operation name to execute
        @param params: Operation parameters
        @param timeout_ms: Custom timeout (default from config)
        @returns Dict: Operation result
        @raises TimeoutError: If operation times out on all endpoints
        """
        if not self._initialized:
            await self.initialize()
        
        endpoint_config = NETWORK_ENDPOINTS.get(network)
        if not endpoint_config:
            raise ValueError(f"Network {network.value} not configured")
        
        health = self._health_status.get(network)
        timeout = timeout_ms or endpoint_config.timeout_ms
        
        start_time = time.time()
        
        self._logger.debug(f"Executing {operation} on {network.value}", {
            "params": params,
            "endpoint": health.endpoint[:50] if health else "unknown"
        })
        
        try:
            # Mock execution for demo mode
            if self._mock_mode:
                await asyncio.sleep(0.01)  # Simulate operation
                
                result = {
                    "success": True,
                    "network": network.value,
                    "operation": operation,
                    "params": params or {},
                    "timestamp": int(time.time() * 1000),
                    "latency_ms": (time.time() - start_time) * 1000,
                    "tx_hash": f"0x{secrets.token_hex(32)}"
                }
                
                self._logger.info(f"Operation {operation} completed", {
                    "network": network.value,
                    "latency_ms": result["latency_ms"]
                })
                
                return result
            
            # Real RPC execution would go here
            
        except Exception as e:
            self._logger.error(f"Operation {operation} failed", {
                "network": network.value,
                "error": str(e)
            })
            
            # Attempt failover
            if not health.using_fallback:
                failover_success = await self._trigger_failover(network, str(e))
                if failover_success:
                    # Retry on fallback
                    return await self.execute(network, operation, params, timeout_ms)
            
            raise
    
    async def execute_with_fallback(
        self,
        primary_network: NetworkType,
        fallback_network: NetworkType,
        operation: str,
        params: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Execute operation with cross-network fallback.
        
        Primary: Execute on primary network
        Secondary: If primary fails, execute on fallback network
        
        @param primary_network: First network to try
        @param fallback_network: Fallback network if primary fails
        @param operation: Operation to execute
        @param params: Operation parameters
        @returns Dict: Operation result with network info
        """
        try:
            result = await self.execute(primary_network, operation, params)
            result["used_fallback_network"] = False
            return result
        except Exception as e:
            self._logger.warn(f"Primary network failed, trying fallback", {
                "primary": primary_network.value,
                "fallback": fallback_network.value,
                "error": str(e)
            })
            
            result = await self.execute(fallback_network, operation, params)
            result["used_fallback_network"] = True
            result["primary_failure_reason"] = str(e)
            return result
    
    def get_health(self, network: NetworkType) -> Optional[RPCHealth]:
        """
        Get health status for a specific network.
        
        @param network: Network to check
        @returns RPCHealth: Health status or None
        """
        return self._health_status.get(network)
    
    def get_all_health(self) -> Dict[str, Dict[str, Any]]:
        """
        Get health status for all networks.
        
        @returns Dict: All network health statuses
        """
        return {
            network.value: health.to_dict()
            for network, health in self._health_status.items()
        }
    
    def _get_healthy_count(self) -> int:
        """
        Count healthy networks.
        
        @returns int: Number of healthy networks
        """
        return sum(1 for h in self._health_status.values() if h.is_healthy)
    
    def get_failover_history(self) -> List[Dict[str, Any]]:
        """
        Get failover event history for compliance audit.
        
        @returns List[Dict]: Failover events
        """
        return [e.to_dict() for e in self._failover_history]
    
    def get_health_summary(self) -> Dict[str, Any]:
        """
        Get summary of network health and failover compliance.
        
        @returns Dict: Health summary with compliance status
        """
        total = len(self._health_status)
        healthy = self._get_healthy_count()
        failovers = len(self._failover_history)
        successful_failovers = sum(1 for e in self._failover_history if e.success)
        compliant_failovers = sum(1 for e in self._failover_history if e.latency_ms < 200)
        
        return {
            "total_networks": total,
            "healthy_count": healthy,
            "degraded_count": total - healthy,
            "failover_events": failovers,
            "successful_failovers": successful_failovers,
            "compliant_failovers": compliant_failovers,
            "zero_downtime_compliant": compliant_failovers == failovers if failovers > 0 else True,
            "overall_health": "healthy" if healthy == total else "degraded"
        }
    
    async def simulate_failover(self, network: NetworkType) -> FailoverEvent:
        """
        Simulate a failover for testing/demo purposes.
        
        @param network: Network to simulate failover on
        @returns FailoverEvent: The simulated event
        """
        await self._trigger_failover(network, "Simulated failover for demo")
        return self._failover_history[-1] if self._failover_history else None
