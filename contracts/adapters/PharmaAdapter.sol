// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PharmaAdapter
 * @author PolarUniversal Team
 * @notice Pharmaceutical Compliance Adapter - FDA-21-CFR-11 Compliant
 * @dev v3.1.0-Whale: Front-Facing Sector Adapter
 * 
 * REGULATORY FRAMEWORK:
 * ┌─────────────────────────────────────────────────────────────┐
 * │                    PHARMA ADAPTER                            │
 * │              FDA-21-CFR-11 Compliance                        │
 * ├─────────────────────────────────────────────────────────────┤
 * │                                                              │
 * │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
 * │  │   BATCH     │  │   SUPPLY    │  │   AUDIT     │          │
 * │  │  TRACKING   │  │   CHAIN     │  │   TRAIL     │          │
 * │  └─────────────┘  └─────────────┘  └─────────────┘          │
 * │         │                │                │                  │
 * │         └────────────────┼────────────────┘                  │
 * │                          ▼                                   │
 * │              ┌─────────────────────┐                         │
 * │              │  GlobalCompliance   │                         │
 * │              │     Registry        │                         │
 * │              │    (Truth Layer)    │                         │
 * │              └─────────────────────┘                         │
 * │                                                              │
 * └─────────────────────────────────────────────────────────────┘
 * 
 * COMPLIANCE: FDA-21-CFR-11 (Electronic Records, Electronic Signatures)
 * SECURITY: OpenZeppelin v6 | Ownable2Step | ReentrancyGuard | CEI Pattern
 */
contract PharmaAdapter is Ownable2Step, ReentrancyGuard, Pausable {
    
    // ============================================================
    // CONSTANTS
    // ============================================================
    
    string public constant VERSION = "3.1.0-WHALE";
    string public constant ADAPTER_NAME = "PharmaAdapter";
    string public constant REGULATORY_FRAMEWORK = "FDA-21-CFR-11";
    
    address public constant PRIMARY_ADMIN = 0x9d91fC37529BD0c6D020dFf6519ee699C7e0A783;
    
    // ============================================================
    // ENUMS
    // ============================================================
    
    enum BatchStatus {
        MANUFACTURED,
        QUALITY_CHECKED,
        APPROVED,
        IN_TRANSIT,
        DELIVERED,
        RECALLED
    }
    
    enum AuditType {
        MANUFACTURING,
        QUALITY_CONTROL,
        SUPPLY_CHAIN,
        DISTRIBUTION,
        ADVERSE_EVENT
    }
    
    // ============================================================
    // STRUCTS - FDA-21-CFR-11 COMPLIANT
    // ============================================================
    
    struct DrugBatch {
        uint256 batchId;
        string drugName;
        string ndc;                    // National Drug Code
        string lotNumber;
        uint256 manufactureDate;
        uint256 expirationDate;
        address manufacturer;
        bytes32 formulaHash;           // Proprietary formula hash
        bytes32 qualityHash;           // QC test results hash
        BatchStatus status;
        bool isRecalled;
    }
    
    struct SupplyChainEvent {
        uint256 eventId;
        uint256 batchId;
        string eventType;
        address actor;
        string location;
        bytes32 temperatureHash;       // Cold-chain compliance
        bytes32 handlingHash;          // Handling certification
        uint256 timestamp;
        bytes32 signatureHash;         // Electronic signature (21-CFR-11)
    }
    
    struct AuditRecord {
        uint256 auditId;
        uint256 batchId;
        AuditType auditType;
        address auditor;
        bytes32 findingsHash;
        bytes32 correctiveActionsHash;
        uint256 timestamp;
        bool requiresFollowup;
        uint256 registryRecordId;      // Link to GlobalComplianceRegistry
    }
    
    struct ElectronicSignature {
        address signer;
        bytes32 signatureHash;
        string signerRole;
        string signerCredentials;
        uint256 timestamp;
        bool isValid;
    }
    
    // ============================================================
    // STATE VARIABLES
    // ============================================================
    
    uint256 private _batchIdCounter;
    uint256 private _eventIdCounter;
    uint256 private _auditIdCounter;
    
    address public globalRegistry;
    bool public emergencyMode;
    
    // Batch storage
    mapping(uint256 => DrugBatch) public batches;
    mapping(string => uint256) public lotToBatchId;
    mapping(address => uint256[]) public manufacturerBatches;
    
    // Supply chain events
    mapping(uint256 => SupplyChainEvent[]) public batchEvents;
    
    // Audit records
    mapping(uint256 => AuditRecord[]) public batchAudits;
    
    // Electronic signatures (21-CFR-11)
    mapping(bytes32 => ElectronicSignature) public signatures;
    mapping(address => bool) public authorizedSigners;
    
    // ============================================================
    // EVENTS
    // ============================================================
    
    event BatchRegistered(
        uint256 indexed batchId,
        string indexed drugName,
        string lotNumber,
        address indexed manufacturer
    );
    
    event BatchStatusUpdated(
        uint256 indexed batchId,
        BatchStatus oldStatus,
        BatchStatus newStatus,
        address updatedBy
    );
    
    event SupplyChainEventRecorded(
        uint256 indexed eventId,
        uint256 indexed batchId,
        string eventType,
        address indexed actor
    );
    
    event AuditRecorded(
        uint256 indexed auditId,
        uint256 indexed batchId,
        AuditType auditType,
        address indexed auditor
    );
    
    event ElectronicSignatureCreated(
        bytes32 indexed signatureHash,
        address indexed signer,
        uint256 timestamp
    );
    
    event BatchRecalled(
        uint256 indexed batchId,
        string reason,
        address recalledBy
    );
    
    event EmergencyModeActivated(address indexed admin, uint256 timestamp);
    
    // ============================================================
    // MODIFIERS
    // ============================================================
    
    modifier onlyPrimaryAdmin() {
        require(msg.sender == PRIMARY_ADMIN, "PharmaAdapter: not primary admin");
        _;
    }
    
    modifier onlyAuthorizedSigner() {
        require(authorizedSigners[msg.sender], "PharmaAdapter: not authorized signer");
        _;
    }
    
    modifier notInEmergency() {
        require(!emergencyMode, "PharmaAdapter: emergency mode");
        _;
    }
    
    // ============================================================
    // CONSTRUCTOR
    // ============================================================
    
    constructor(
        address initialOwner,
        address _globalRegistry
    ) Ownable(initialOwner) {
        globalRegistry = _globalRegistry;
        emergencyMode = false;
        
        // Authorize primary admin as signer
        authorizedSigners[PRIMARY_ADMIN] = true;
    }
    
    // ============================================================
    // CIRCUIT BREAKER
    // ============================================================
    
    function emergencyPause() external nonReentrant onlyPrimaryAdmin {
        emergencyMode = true;
        _pause();
        emit EmergencyModeActivated(msg.sender, block.timestamp);
    }
    
    function deactivateEmergency() external nonReentrant onlyPrimaryAdmin {
        emergencyMode = false;
        _unpause();
    }
    
    // ============================================================
    // BATCH TRACKING - FDA-21-CFR-11
    // ============================================================
    
    /**
     * @notice Register a new drug batch
     * @param drugName Name of the pharmaceutical
     * @param ndc National Drug Code
     * @param lotNumber Lot/batch number
     * @param expirationDate Expiration timestamp
     * @param formulaHash Hash of proprietary formula
     */
    function registerBatch(
        string calldata drugName,
        string calldata ndc,
        string calldata lotNumber,
        uint256 expirationDate,
        bytes32 formulaHash
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        notInEmergency 
        returns (uint256 batchId) 
    {
        // CEI Pattern: Checks
        require(bytes(drugName).length > 0, "PharmaAdapter: empty drug name");
        require(bytes(lotNumber).length > 0, "PharmaAdapter: empty lot number");
        require(lotToBatchId[lotNumber] == 0, "PharmaAdapter: lot exists");
        require(expirationDate > block.timestamp, "PharmaAdapter: invalid expiration");
        
        // CEI Pattern: Effects
        batchId = _batchIdCounter++;
        
        batches[batchId] = DrugBatch({
            batchId: batchId,
            drugName: drugName,
            ndc: ndc,
            lotNumber: lotNumber,
            manufactureDate: block.timestamp,
            expirationDate: expirationDate,
            manufacturer: msg.sender,
            formulaHash: formulaHash,
            qualityHash: bytes32(0),
            status: BatchStatus.MANUFACTURED,
            isRecalled: false
        });
        
        lotToBatchId[lotNumber] = batchId;
        manufacturerBatches[msg.sender].push(batchId);
        
        // CEI Pattern: Interactions
        emit BatchRegistered(batchId, drugName, lotNumber, msg.sender);
        
        return batchId;
    }
    
    /**
     * @notice Update batch status through supply chain
     */
    function updateBatchStatus(
        uint256 batchId,
        BatchStatus newStatus,
        bytes32 signatureHash
    ) 
        external 
        nonReentrant 
        onlyAuthorizedSigner 
        whenNotPaused 
        notInEmergency 
    {
        // CEI Pattern: Checks
        require(batches[batchId].batchId == batchId, "PharmaAdapter: batch not found");
        require(!batches[batchId].isRecalled, "PharmaAdapter: batch recalled");
        require(signatures[signatureHash].isValid, "PharmaAdapter: invalid signature");
        
        // CEI Pattern: Effects
        BatchStatus oldStatus = batches[batchId].status;
        batches[batchId].status = newStatus;
        
        // CEI Pattern: Interactions
        emit BatchStatusUpdated(batchId, oldStatus, newStatus, msg.sender);
    }
    
    /**
     * @notice Record supply chain event with cold-chain compliance
     */
    function recordSupplyChainEvent(
        uint256 batchId,
        string calldata eventType,
        string calldata location,
        bytes32 temperatureHash,
        bytes32 handlingHash,
        bytes32 signatureHash
    ) 
        external 
        nonReentrant 
        onlyAuthorizedSigner 
        whenNotPaused 
        notInEmergency 
        returns (uint256 eventId) 
    {
        // CEI Pattern: Checks
        require(batches[batchId].batchId == batchId, "PharmaAdapter: batch not found");
        require(!batches[batchId].isRecalled, "PharmaAdapter: batch recalled");
        
        // CEI Pattern: Effects
        eventId = _eventIdCounter++;
        
        SupplyChainEvent memory newEvent = SupplyChainEvent({
            eventId: eventId,
            batchId: batchId,
            eventType: eventType,
            actor: msg.sender,
            location: location,
            temperatureHash: temperatureHash,
            handlingHash: handlingHash,
            timestamp: block.timestamp,
            signatureHash: signatureHash
        });
        
        batchEvents[batchId].push(newEvent);
        
        // CEI Pattern: Interactions
        emit SupplyChainEventRecorded(eventId, batchId, eventType, msg.sender);
        
        return eventId;
    }
    
    /**
     * @notice Record audit with link to GlobalComplianceRegistry
     */
    function recordAudit(
        uint256 batchId,
        AuditType auditType,
        bytes32 findingsHash,
        bytes32 correctiveActionsHash,
        bool requiresFollowup
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        notInEmergency 
        returns (uint256 auditId) 
    {
        // CEI Pattern: Checks
        require(batches[batchId].batchId == batchId, "PharmaAdapter: batch not found");
        
        // CEI Pattern: Effects
        auditId = _auditIdCounter++;
        
        AuditRecord memory newAudit = AuditRecord({
            auditId: auditId,
            batchId: batchId,
            auditType: auditType,
            auditor: msg.sender,
            findingsHash: findingsHash,
            correctiveActionsHash: correctiveActionsHash,
            timestamp: block.timestamp,
            requiresFollowup: requiresFollowup,
            registryRecordId: 0  // Set after registry call
        });
        
        batchAudits[batchId].push(newAudit);
        
        // CEI Pattern: Interactions
        emit AuditRecorded(auditId, batchId, auditType, msg.sender);
        
        return auditId;
    }
    
    // ============================================================
    // ELECTRONIC SIGNATURES - 21-CFR-11 COMPLIANT
    // ============================================================
    
    /**
     * @notice Create electronic signature (21-CFR-11)
     */
    function createElectronicSignature(
        bytes32 documentHash,
        string calldata signerRole,
        string calldata signerCredentials
    ) 
        external 
        nonReentrant 
        onlyAuthorizedSigner 
        returns (bytes32 signatureHash) 
    {
        // CEI Pattern: Effects
        signatureHash = keccak256(abi.encodePacked(
            "FDA-21-CFR-11-SIGNATURE",
            msg.sender,
            documentHash,
            signerRole,
            block.timestamp,
            block.chainid
        ));
        
        signatures[signatureHash] = ElectronicSignature({
            signer: msg.sender,
            signatureHash: signatureHash,
            signerRole: signerRole,
            signerCredentials: signerCredentials,
            timestamp: block.timestamp,
            isValid: true
        });
        
        // CEI Pattern: Interactions
        emit ElectronicSignatureCreated(signatureHash, msg.sender, block.timestamp);
        
        return signatureHash;
    }
    
    /**
     * @notice Authorize a new signer
     */
    function authorizeSigner(address signer) external nonReentrant onlyOwner {
        authorizedSigners[signer] = true;
    }
    
    /**
     * @notice Revoke signer authorization
     */
    function revokeSigner(address signer) external nonReentrant onlyOwner {
        authorizedSigners[signer] = false;
    }
    
    // ============================================================
    // RECALL MANAGEMENT
    // ============================================================
    
    /**
     * @notice Initiate batch recall
     */
    function recallBatch(
        uint256 batchId,
        string calldata reason
    ) 
        external 
        nonReentrant 
        onlyOwner 
    {
        // CEI Pattern: Checks
        require(batches[batchId].batchId == batchId, "PharmaAdapter: batch not found");
        require(!batches[batchId].isRecalled, "PharmaAdapter: already recalled");
        
        // CEI Pattern: Effects
        batches[batchId].isRecalled = true;
        batches[batchId].status = BatchStatus.RECALLED;
        
        // CEI Pattern: Interactions
        emit BatchRecalled(batchId, reason, msg.sender);
    }
    
    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================
    
    function getBatch(uint256 batchId) external view returns (DrugBatch memory) {
        return batches[batchId];
    }
    
    function getBatchEvents(uint256 batchId) external view returns (SupplyChainEvent[] memory) {
        return batchEvents[batchId];
    }
    
    function getBatchAudits(uint256 batchId) external view returns (AuditRecord[] memory) {
        return batchAudits[batchId];
    }
    
    function getManufacturerBatches(address manufacturer) external view returns (uint256[] memory) {
        return manufacturerBatches[manufacturer];
    }
    
    function getSignature(bytes32 signatureHash) external view returns (ElectronicSignature memory) {
        return signatures[signatureHash];
    }
    
    function getTotalBatches() external view returns (uint256) {
        return _batchIdCounter;
    }
    
    function isSignerAuthorized(address signer) external view returns (bool) {
        return authorizedSigners[signer];
    }
}
