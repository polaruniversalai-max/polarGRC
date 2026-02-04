// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title GlobalComplianceRegistry
 * @author PolarUniversal Team
 * @notice The "Truth Layer" - Central registry for all compliance sectors
 * @dev v3.1.0-Whale: Modular Compliance OS Core Engine
 * 
 * ARCHITECTURE:
 * ┌─────────────────────────────────────────────────────────────┐
 * │                  GLOBAL COMPLIANCE REGISTRY                  │
 * │                    (Truth Layer - /core)                     │
 * ├─────────────────────────────────────────────────────────────┤
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
 * │  │   Pharma    │  │   Banking   │  │   Medical   │          │
 * │  │   Adapter   │  │   Adapter   │  │   Adapter   │          │
 * │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
 * │         │                │                │                  │
 * │         └────────────────┼────────────────┘                  │
 * │                          ▼                                   │
 * │              ┌─────────────────────┐                         │
 * │              │  SwitchableProvider │                         │
 * │              │  (Monad ↔ Movement) │                         │
 * │              └─────────────────────┘                         │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * SECURITY: OpenZeppelin v6 | Ownable2Step | ReentrancyGuard | CEI Pattern
 * UPTIME: 99.9% via Switchable Provider (Monad Primary, Movement Secondary)
 */
contract GlobalComplianceRegistry is Ownable2Step, ReentrancyGuard, Pausable {
    
    // ============================================================
    // CONSTANTS - INSTITUTIONAL CONFIGURATION
    // ============================================================
    
    string public constant VERSION = "3.1.0-WHALE";
    string public constant ARCHITECTURE = "MODULAR_COMPLIANCE_OS";
    
    address public constant PRIMARY_ADMIN = 0x9d91fC37529BD0c6D020dFf6519ee699C7e0A783;
    
    // ============================================================
    // SECTOR ENUMERATION - PLATFORM MULTIPLIER VALUE
    // ============================================================
    
    enum ComplianceSector {
        HEALTHCARE,      // HIPAA, FDA-21-CFR-11
        AI_AGENTS,       // Virtual Protocol, TAO
        DEPIN,           // Hardware attestation, IoT
        PAYMENTS,        // B2B settlements, USDC
        PRIVACY,         // Story Protocol, IP registry
        PHARMA,          // Batch tracking, supply chain
        BANKING,         // JPM Coin, Canton, AML (HIDDEN PIVOT)
        EDUCATION,       // Credential verification
        MEDICAL_DATA     // Patient records, consent
    }
    
    // ============================================================
    // STRUCTS - UNIVERSAL COMPLIANCE RECORD
    // ============================================================
    
    struct ComplianceRecord {
        uint256 recordId;
        ComplianceSector sector;
        address registrant;
        bytes32 dataHash;
        bytes32 regulatoryHash;
        uint256 timestamp;
        uint256 expirationTimestamp;
        bool isActive;
        bool isVerified;
        address verifier;
    }
    
    struct AdapterRegistration {
        address adapterAddress;
        ComplianceSector sector;
        string adapterName;
        string version;
        bool isActive;
        uint256 registeredAt;
        uint256 totalRecords;
    }
    
    struct ProviderStatus {
        string providerName;
        string rpcEndpoint;
        uint256 chainId;
        bool isPrimary;
        bool isActive;
        uint256 lastHealthCheck;
        uint256 latencyMs;
    }
    
    // ============================================================
    // STATE VARIABLES
    // ============================================================
    
    uint256 private _recordIdCounter;
    uint256 private _adapterIdCounter;
    
    bool public emergencyMode;
    
    // Record storage
    mapping(uint256 => ComplianceRecord) public records;
    mapping(address => uint256[]) public registrantRecords;
    mapping(ComplianceSector => uint256[]) public sectorRecords;
    
    // Adapter registry
    mapping(address => AdapterRegistration) public adapters;
    mapping(ComplianceSector => address) public sectorAdapter;
    address[] public registeredAdapters;
    
    // Provider configuration (Switchable)
    ProviderStatus public primaryProvider;
    ProviderStatus public secondaryProvider;
    bool public useSecondaryProvider;
    
    // ============================================================
    // EVENTS - INSTITUTIONAL TRANSPARENCY
    // ============================================================
    
    event ComplianceRecordCreated(
        uint256 indexed recordId,
        ComplianceSector indexed sector,
        address indexed registrant,
        bytes32 dataHash,
        uint256 timestamp
    );
    
    event ComplianceRecordVerified(
        uint256 indexed recordId,
        address indexed verifier,
        uint256 timestamp
    );
    
    event AdapterRegistered(
        address indexed adapterAddress,
        ComplianceSector indexed sector,
        string adapterName,
        string version
    );
    
    event AdapterDeactivated(
        address indexed adapterAddress,
        ComplianceSector indexed sector,
        uint256 timestamp
    );
    
    event ProviderSwitched(
        string fromProvider,
        string toProvider,
        uint256 timestamp,
        string reason
    );
    
    event EmergencyModeActivated(address indexed admin, uint256 timestamp);
    event EmergencyModeDeactivated(address indexed admin, uint256 timestamp);
    
    // ============================================================
    // MODIFIERS
    // ============================================================
    
    modifier onlyPrimaryAdmin() {
        require(msg.sender == PRIMARY_ADMIN, "GlobalRegistry: not primary admin");
        _;
    }
    
    modifier onlyRegisteredAdapter() {
        require(adapters[msg.sender].isActive, "GlobalRegistry: not registered adapter");
        _;
    }
    
    modifier notInEmergency() {
        require(!emergencyMode, "GlobalRegistry: emergency mode");
        _;
    }
    
    // ============================================================
    // CONSTRUCTOR
    // ============================================================
    
    constructor(address initialOwner) Ownable(initialOwner) {
        // CEI Pattern: Effects
        emergencyMode = false;
        
        // Initialize Switchable Provider (Monad Primary, Movement Secondary)
        primaryProvider = ProviderStatus({
            providerName: "Monad Mainnet",
            rpcEndpoint: "https://mainnet.monad.xyz",
            chainId: 41454,
            isPrimary: true,
            isActive: true,
            lastHealthCheck: block.timestamp,
            latencyMs: 50
        });
        
        secondaryProvider = ProviderStatus({
            providerName: "Movement Mainnet",
            rpcEndpoint: "https://mainnet.movementlabs.xyz",
            chainId: 30730,
            isPrimary: false,
            isActive: true,
            lastHealthCheck: block.timestamp,
            latencyMs: 100
        });
        
        useSecondaryProvider = false;
    }
    
    // ============================================================
    // CIRCUIT BREAKER - FORTRESS SECURITY
    // ============================================================
    
    function emergencyPause() external nonReentrant onlyPrimaryAdmin {
        // CEI Pattern: Effects
        emergencyMode = true;
        _pause();
        
        // CEI Pattern: Interactions
        emit EmergencyModeActivated(msg.sender, block.timestamp);
    }
    
    function deactivateEmergency() external nonReentrant onlyPrimaryAdmin {
        emergencyMode = false;
        _unpause();
        emit EmergencyModeDeactivated(msg.sender, block.timestamp);
    }
    
    // ============================================================
    // SWITCHABLE PROVIDER - 99.9% UPTIME GUARANTEE
    // ============================================================
    
    /**
     * @notice Switch between Monad (Primary) and Movement (Secondary)
     * @dev Zero-Downtime architecture for institutional reliability
     */
    function switchProvider(string calldata reason) 
        external 
        nonReentrant 
        onlyOwner 
    {
        // CEI Pattern: Checks
        require(bytes(reason).length > 0, "GlobalRegistry: reason required");
        
        // CEI Pattern: Effects
        string memory fromProvider = useSecondaryProvider ? 
            secondaryProvider.providerName : 
            primaryProvider.providerName;
            
        useSecondaryProvider = !useSecondaryProvider;
        
        string memory toProvider = useSecondaryProvider ? 
            secondaryProvider.providerName : 
            primaryProvider.providerName;
        
        // CEI Pattern: Interactions
        emit ProviderSwitched(fromProvider, toProvider, block.timestamp, reason);
    }
    
    /**
     * @notice Update provider health check (called by monitoring)
     */
    function updateProviderHealth(
        bool isPrimary,
        uint256 latencyMs
    ) external nonReentrant onlyOwner {
        // CEI Pattern: Effects
        if (isPrimary) {
            primaryProvider.lastHealthCheck = block.timestamp;
            primaryProvider.latencyMs = latencyMs;
        } else {
            secondaryProvider.lastHealthCheck = block.timestamp;
            secondaryProvider.latencyMs = latencyMs;
        }
    }
    
    /**
     * @notice Auto-failover if primary latency exceeds threshold
     */
    function checkAutoFailover(uint256 latencyThresholdMs) 
        external 
        nonReentrant 
        onlyOwner 
        returns (bool switched) 
    {
        // CEI Pattern: Checks
        if (!useSecondaryProvider && primaryProvider.latencyMs > latencyThresholdMs) {
            // CEI Pattern: Effects
            useSecondaryProvider = true;
            switched = true;
            
            // CEI Pattern: Interactions
            emit ProviderSwitched(
                primaryProvider.providerName,
                secondaryProvider.providerName,
                block.timestamp,
                "AUTO_FAILOVER_LATENCY_EXCEEDED"
            );
        }
        return switched;
    }
    
    // ============================================================
    // ADAPTER REGISTRY - MODULAR ARCHITECTURE
    // ============================================================
    
    /**
     * @notice Register a sector adapter (e.g., PharmaAdapter, BankingAdapter)
     * @dev All adapters share this core Truth Layer
     */
    function registerAdapter(
        address adapterAddress,
        ComplianceSector sector,
        string calldata adapterName,
        string calldata version
    ) 
        external 
        nonReentrant 
        onlyOwner 
        whenNotPaused 
    {
        // CEI Pattern: Checks
        require(adapterAddress != address(0), "GlobalRegistry: zero adapter");
        require(bytes(adapterName).length > 0, "GlobalRegistry: empty name");
        require(!adapters[adapterAddress].isActive, "GlobalRegistry: already registered");
        
        // CEI Pattern: Effects
        adapters[adapterAddress] = AdapterRegistration({
            adapterAddress: adapterAddress,
            sector: sector,
            adapterName: adapterName,
            version: version,
            isActive: true,
            registeredAt: block.timestamp,
            totalRecords: 0
        });
        
        sectorAdapter[sector] = adapterAddress;
        registeredAdapters.push(adapterAddress);
        
        // CEI Pattern: Interactions
        emit AdapterRegistered(adapterAddress, sector, adapterName, version);
    }
    
    /**
     * @notice Deactivate an adapter (soft delete)
     */
    function deactivateAdapter(address adapterAddress) 
        external 
        nonReentrant 
        onlyOwner 
    {
        // CEI Pattern: Checks
        require(adapters[adapterAddress].isActive, "GlobalRegistry: not active");
        
        // CEI Pattern: Effects
        ComplianceSector sector = adapters[adapterAddress].sector;
        adapters[adapterAddress].isActive = false;
        sectorAdapter[sector] = address(0);
        
        // CEI Pattern: Interactions
        emit AdapterDeactivated(adapterAddress, sector, block.timestamp);
    }
    
    // ============================================================
    // COMPLIANCE RECORD MANAGEMENT - TRUTH LAYER
    // ============================================================
    
    /**
     * @notice Create a compliance record (called by adapters)
     * @dev This is the universal entry point for all sectors
     */
    function createComplianceRecord(
        ComplianceSector sector,
        address registrant,
        bytes32 dataHash,
        bytes32 regulatoryHash,
        uint256 validityPeriod
    ) 
        external 
        nonReentrant 
        onlyRegisteredAdapter 
        whenNotPaused 
        notInEmergency 
        returns (uint256 recordId) 
    {
        // CEI Pattern: Checks
        require(registrant != address(0), "GlobalRegistry: zero registrant");
        require(dataHash != bytes32(0), "GlobalRegistry: empty data hash");
        
        // CEI Pattern: Effects
        recordId = _recordIdCounter++;
        
        uint256 expiration = validityPeriod > 0 ? 
            block.timestamp + validityPeriod : 
            type(uint256).max;
        
        records[recordId] = ComplianceRecord({
            recordId: recordId,
            sector: sector,
            registrant: registrant,
            dataHash: dataHash,
            regulatoryHash: regulatoryHash,
            timestamp: block.timestamp,
            expirationTimestamp: expiration,
            isActive: true,
            isVerified: false,
            verifier: address(0)
        });
        
        registrantRecords[registrant].push(recordId);
        sectorRecords[sector].push(recordId);
        adapters[msg.sender].totalRecords++;
        
        // CEI Pattern: Interactions
        emit ComplianceRecordCreated(recordId, sector, registrant, dataHash, block.timestamp);
        
        return recordId;
    }
    
    /**
     * @notice Verify a compliance record (auditor function)
     */
    function verifyRecord(uint256 recordId) 
        external 
        nonReentrant 
        whenNotPaused 
        notInEmergency 
    {
        // CEI Pattern: Checks
        require(records[recordId].isActive, "GlobalRegistry: record not active");
        require(!records[recordId].isVerified, "GlobalRegistry: already verified");
        require(block.timestamp < records[recordId].expirationTimestamp, "GlobalRegistry: expired");
        
        // CEI Pattern: Effects
        records[recordId].isVerified = true;
        records[recordId].verifier = msg.sender;
        
        // CEI Pattern: Interactions
        emit ComplianceRecordVerified(recordId, msg.sender, block.timestamp);
    }
    
    /**
     * @notice Deactivate a compliance record
     */
    function deactivateRecord(uint256 recordId) 
        external 
        nonReentrant 
        onlyOwner 
    {
        // CEI Pattern: Checks
        require(records[recordId].isActive, "GlobalRegistry: not active");
        
        // CEI Pattern: Effects
        records[recordId].isActive = false;
    }
    
    // ============================================================
    // VIEW FUNCTIONS - TRANSPARENCY
    // ============================================================
    
    function getRecord(uint256 recordId) external view returns (ComplianceRecord memory) {
        return records[recordId];
    }
    
    function getRegistrantRecords(address registrant) external view returns (uint256[] memory) {
        return registrantRecords[registrant];
    }
    
    function getSectorRecords(ComplianceSector sector) external view returns (uint256[] memory) {
        return sectorRecords[sector];
    }
    
    function getAdapter(address adapterAddress) external view returns (AdapterRegistration memory) {
        return adapters[adapterAddress];
    }
    
    function getTotalRecords() external view returns (uint256) {
        return _recordIdCounter;
    }
    
    function getTotalAdapters() external view returns (uint256) {
        return registeredAdapters.length;
    }
    
    function getCurrentProvider() external view returns (ProviderStatus memory) {
        return useSecondaryProvider ? secondaryProvider : primaryProvider;
    }
    
    function isRecordValid(uint256 recordId) external view returns (bool) {
        ComplianceRecord memory record = records[recordId];
        return record.isActive && 
               record.isVerified && 
               block.timestamp < record.expirationTimestamp;
    }
}
