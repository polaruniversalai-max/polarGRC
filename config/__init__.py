"""
Sentinel OS v1.1 - Configuration Module
========================================
Centralized configuration management for enterprise deployment.

@module config
@version 1.1.0
"""

from .settings import (
    Settings,
    settings,
    get_settings,
    get_network_endpoint,
    NetworkType,
    NetworkEndpoint,
    Environment,
    OpikConfig,
    ComplianceConfig,
    PharmaConfig,
    BankingConfig,
    HealthcareConfig,
    NETWORK_ENDPOINTS
)

__all__ = [
    "Settings",
    "settings",
    "get_settings",
    "get_network_endpoint",
    "NetworkType",
    "NetworkEndpoint",
    "Environment",
    "OpikConfig",
    "ComplianceConfig",
    "PharmaConfig",
    "BankingConfig",
    "HealthcareConfig",
    "NETWORK_ENDPOINTS"
]

__version__ = "1.1.0"
