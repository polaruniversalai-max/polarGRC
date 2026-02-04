"""
Sentinel OS v1.1 - Centralized Configuration
============================================
All environment variables, network endpoints, and constants.
Single source of truth for enterprise deployment.

@module config.settings
@version 1.1.0
@author PolarUniversal
"""

import os
from dataclasses import dataclass, field
from typing import Dict, List, Optional
from enum import Enum


class Environment(Enum):
    """Deployment environment modes."""
    DEVELOPMENT = "development"
    STAGING = "staging"
    PRODUCTION = "production"


class NetworkType(Enum):
    """Supported blockchain networks."""
    MOVEMENT_M1 = "movement_m1"
    CELESTIA_DA = "celestia_da"
    STACKS = "stacks"
    SOLANA = "solana"
    ICP = "icp"
    ETHEREUM = "ethereum"
    POLYGON = "polygon"
    ARBITRUM = "arbitrum"


@dataclass
class NetworkEndpoint:
    """
    Network RPC endpoint configuration.
    
    @param name: Human-readable network name
    @param network_type: NetworkType enum value
    @param primary_rpc: Primary RPC endpoint URL
    @param fallback_rpc: Secondary fallback RPC endpoint
    @param timeout_ms: Request timeout in milliseconds
    @param max_retries: Maximum retry attempts before failover
    @param health_check_interval_ms: Health check polling interval
    """
    name: str
    network_type: NetworkType
    primary_rpc: str
    fallback_rpc: str
    timeout_ms: int = 5000
    max_retries: int = 3
    health_check_interval_ms: int = 30000


@dataclass
class OpikConfig:
    """Opik observability configuration."""
    api_key: str = field(default_factory=lambda: os.getenv("OPIK_API_KEY", ""))
    project_name: str = "polar-grc-enterprise"
    workspace: str = "polar-universal"
    dashboard_url: str = "https://www.comet.com/opik/polar-universal/home"
    trace_enabled: bool = True
    log_level: str = "INFO"


@dataclass
class ComplianceConfig:
    """Compliance standards configuration."""
    dscsa_2026_enabled: bool = True
    hipaa_enabled: bool = True
    dpdp_act_enabled: bool = True
    gdpr_enabled: bool = True
    rbi_sandbox_enabled: bool = True
    cdsco_audit_enabled: bool = True


# =============================================================================
# NETWORK ENDPOINTS - Primary/Secondary Failover Configuration
# =============================================================================

NETWORK_ENDPOINTS: Dict[NetworkType, NetworkEndpoint] = {
    NetworkType.MOVEMENT_M1: NetworkEndpoint(
        name="Movement M1 Mainnet",
        network_type=NetworkType.MOVEMENT_M1,
        primary_rpc="https://mainnet.movementnetwork.xyz/v1",
        fallback_rpc="https://devnet.movementnetwork.xyz/v1",
        timeout_ms=5000,
        max_retries=3,
        health_check_interval_ms=30000
    ),
    NetworkType.CELESTIA_DA: NetworkEndpoint(
        name="Celestia Data Availability",
        network_type=NetworkType.CELESTIA_DA,
        primary_rpc="https://rpc.celestia.org",
        fallback_rpc="https://celestia-rpc.polkachu.com",
        timeout_ms=10000,
        max_retries=2,
        health_check_interval_ms=60000
    ),
    NetworkType.STACKS: NetworkEndpoint(
        name="Stacks Bitcoin L2",
        network_type=NetworkType.STACKS,
        primary_rpc="https://stacks-node-api.mainnet.stacks.co",
        fallback_rpc="https://api.hiro.so",
        timeout_ms=8000,
        max_retries=3,
        health_check_interval_ms=45000
    ),
    NetworkType.SOLANA: NetworkEndpoint(
        name="Solana Mainnet",
        network_type=NetworkType.SOLANA,
        primary_rpc="https://api.mainnet-beta.solana.com",
        fallback_rpc="https://solana-api.projectserum.com",
        timeout_ms=5000,
        max_retries=3,
        health_check_interval_ms=30000
    ),
    NetworkType.ICP: NetworkEndpoint(
        name="Internet Computer",
        network_type=NetworkType.ICP,
        primary_rpc="https://icp-api.io",
        fallback_rpc="https://ic0.app",
        timeout_ms=10000,
        max_retries=2,
        health_check_interval_ms=60000
    ),
    NetworkType.ETHEREUM: NetworkEndpoint(
        name="Ethereum Mainnet",
        network_type=NetworkType.ETHEREUM,
        primary_rpc=os.getenv("ETHEREUM_RPC", "https://eth.llamarpc.com"),
        fallback_rpc="https://rpc.ankr.com/eth",
        timeout_ms=10000,
        max_retries=3,
        health_check_interval_ms=30000
    ),
    NetworkType.POLYGON: NetworkEndpoint(
        name="Polygon PoS",
        network_type=NetworkType.POLYGON,
        primary_rpc="https://polygon-rpc.com",
        fallback_rpc="https://rpc.ankr.com/polygon",
        timeout_ms=5000,
        max_retries=3,
        health_check_interval_ms=30000
    ),
    NetworkType.ARBITRUM: NetworkEndpoint(
        name="Arbitrum One",
        network_type=NetworkType.ARBITRUM,
        primary_rpc="https://arb1.arbitrum.io/rpc",
        fallback_rpc="https://rpc.ankr.com/arbitrum",
        timeout_ms=5000,
        max_retries=3,
        health_check_interval_ms=30000
    ),
}


# =============================================================================
# SECTOR-SPECIFIC CONFIGURATION
# =============================================================================

@dataclass
class PharmaConfig:
    """
    Pharma sector configuration (DSCSA 2026).
    
    Primary: Movement M1 for batch verification
    Secondary: Celestia DA for data availability fallback
    """
    primary_network: NetworkType = NetworkType.MOVEMENT_M1
    fallback_network: NetworkType = NetworkType.CELESTIA_DA
    gs1_validation_enabled: bool = True
    atp_verification_enabled: bool = True
    quarantine_threshold_hours: int = 24
    zk_shielding_enabled: bool = True
    batch_size_limit: int = 1000


@dataclass
class BankingConfig:
    """
    Banking sector configuration (AML/KYC).
    
    Primary: FET.ai Agentic Gateway
    Secondary: Stacks for Bitcoin-level finality
    """
    primary_network: NetworkType = NetworkType.STACKS
    fallback_network: NetworkType = NetworkType.ETHEREUM
    aml_screening_enabled: bool = True
    rbi_sandbox_mode: bool = True
    max_transaction_inr: int = 10_000_000
    human_approval_threshold_usd: int = 25_000
    fetch_ai_enabled: bool = True


@dataclass
class HealthcareConfig:
    """
    Healthcare sector configuration (HIPAA/DPDP).
    
    Primary: ICP Patient Vault for DPDP compliance
    Secondary: Stacks for Bitcoin anchoring
    """
    primary_network: NetworkType = NetworkType.ICP
    fallback_network: NetworkType = NetworkType.STACKS
    data_residency: str = "india"
    hipaa_audit_enabled: bool = True
    dpdp_consent_required: bool = True
    retention_days: int = 2555  # 7 years
    pii_encryption_enabled: bool = True


# =============================================================================
# GLOBAL SETTINGS
# =============================================================================

@dataclass
class Settings:
    """
    Master settings container for Sentinel OS.
    
    Aggregates all configuration sections into a single
    injectable dependency for enterprise modularity.
    """
    environment: Environment = Environment.DEVELOPMENT
    version: str = "1.1.0"
    
    # Network orchestration
    failover_timeout_ms: int = 200
    max_concurrent_requests: int = 100
    health_check_enabled: bool = True
    
    # Observability
    opik: OpikConfig = field(default_factory=OpikConfig)
    
    # Compliance
    compliance: ComplianceConfig = field(default_factory=ComplianceConfig)
    
    # Sector configs
    pharma: PharmaConfig = field(default_factory=PharmaConfig)
    banking: BankingConfig = field(default_factory=BankingConfig)
    healthcare: HealthcareConfig = field(default_factory=HealthcareConfig)
    
    # API Keys (from environment)
    etherscan_api_key: str = field(default_factory=lambda: os.getenv("ETHERSCAN_API_KEY", ""))
    movement_private_key: str = field(default_factory=lambda: os.getenv("MOVEMENT_PRIVATE_KEY", ""))
    
    # Grant tracking
    grant_targets: Dict[str, int] = field(default_factory=lambda: {
        "jp_morgan_medtech": 175_000,
        "phathom_pharma": 175_000,
        "google_cloud_scale": 350_000
    })


# Singleton instance
settings = Settings()


def get_settings() -> Settings:
    """
    Get the global settings instance.
    
    @returns Settings: The singleton settings object
    """
    return settings


def get_network_endpoint(network_type: NetworkType) -> NetworkEndpoint:
    """
    Get network endpoint configuration by type.
    
    @param network_type: The NetworkType to retrieve
    @returns NetworkEndpoint: The endpoint configuration
    @raises KeyError: If network type not configured
    """
    return NETWORK_ENDPOINTS[network_type]
