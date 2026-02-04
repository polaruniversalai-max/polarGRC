// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title DePinAssetAdapter
 * @author PolarUniversal Team
 * @notice Decentralized Physical Infrastructure (DePIN) Asset Adapter
 * @dev v3.1.0-Whale: Cross-Sector Adapter Stub
 * 
 * USE CASES:
 * - IoT Device Registration
 * - Hardware Attestation
 * - Location Verification
 * - Energy/Compute Resource Tracking
 * 
 * ECOSYSTEM TOKENS: $AKT, $BSR, $IO, $RNDR
 * 
 * STUB: Core structure implemented, ready for sector-specific expansion
 */
contract DePinAssetAdapter is Ownable2Step, ReentrancyGuard, Pausable {
    
    string public constant VERSION = "3.1.0-WHALE";
    string public constant ADAPTER_NAME = "DePinAssetAdapter";
    string public constant REGULATORY_FRAMEWORK = "DEPIN_ATTESTATION";
    
    address public constant PRIMARY_ADMIN = 0x9d91fC37529BD0c6D020dFf6519ee699C7e0A783;
    address public globalRegistry;
    bool public emergencyMode;
    
    // ============================================================
    // ENUMS
    // ============================================================
    
    enum AssetType {
        COMPUTE_NODE,           // $AKT, $RNDR
        STORAGE_NODE,           // $IO
        SENSOR_DEVICE,          // $BSR
        ENERGY_DEVICE,
        CONNECTIVITY_NODE,
        GPS_BEACON              // Seeker integration
    }
    
    enum AssetStatus {
        REGISTERED,
        ATTESTED,
        ACTIVE,
        OFFLINE,
        DECOMMISSIONED
    }
    
    // ============================================================
    // STRUCTS
    // ============================================================
    
    struct DePinAsset {
        uint256 assetId;
        AssetType assetType;
        AssetStatus status;
        address owner;
        bytes32 hardwareHash;           // TEE attestation
        bytes32 locationHash;           // GPS verification
        bytes32 firmwareHash;           // Software version
        uint256 registeredAt;
        uint256 lastAttestationAt;
        uint256 uptimeSeconds;
        bool isVerified;
    }
    
    struct AttestationRecord {
        uint256 attestationId;
        uint256 assetId;
        bytes32 attestationHash;
        bytes32 proofHash;              // ZK-proof of hardware
        address attester;
        uint256 timestamp;
        bool isValid;
    }
    
    struct ResourceContribution {
        uint256 contributionId;
        uint256 assetId;
        uint256 computeUnits;           // GPU/CPU hours
        uint256 storageBytes;           // Storage provided
        uint256 bandwidthBytes;         // Network contribution
        uint256 periodStart;
        uint256 periodEnd;
        uint256 rewardAmount;
    }
    
    // ============================================================
    // STATE VARIABLES
    // ============================================================
    
    uint256 private _assetIdCounter;
    uint256 private _attestationIdCounter;
    uint256 private _contributionIdCounter;
    
    mapping(uint256 => DePinAsset) public assets;
    mapping(address => uint256[]) public ownerAssets;
    mapping(bytes32 => uint256) public hardwareHashToAssetId;
    
    mapping(uint256 => AttestationRecord[]) public assetAttestations;
    mapping(uint256 => ResourceContribution[]) public assetContributions;
    
    mapping(address => bool) public authorizedAttesters;
    
    // ============================================================
    // EVENTS
    // ============================================================
    
    event AssetRegistered(
        uint256 indexed assetId,
        AssetType assetType,
        address indexed owner,
        bytes32 hardwareHash
    );
    
    event AssetAttested(
        uint256 indexed attestationId,
        uint256 indexed assetId,
        address indexed attester
    );
    
    event ContributionRecorded(
        uint256 indexed contributionId,
        uint256 indexed assetId,
        uint256 computeUnits,
        uint256 rewardAmount
    );
    
    event AssetStatusUpdated(
        uint256 indexed assetId,
        AssetStatus oldStatus,
        AssetStatus newStatus
    );
    
    event EmergencyModeActivated(address indexed admin, uint256 timestamp);
    
    // ============================================================
    // MODIFIERS
    // ============================================================
    
    modifier onlyPrimaryAdmin() {
        require(msg.sender == PRIMARY_ADMIN, "DePinAdapter: not primary admin");
        _;
    }
    
    modifier onlyAuthorizedAttester() {
        require(authorizedAttesters[msg.sender], "DePinAdapter: not authorized");
        _;
    }
    
    modifier onlyAssetOwner(uint256 assetId) {
        require(assets[assetId].owner == msg.sender, "DePinAdapter: not owner");
        _;
    }
    
    modifier notInEmergency() {
        require(!emergencyMode, "DePinAdapter: emergency mode");
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
        authorizedAttesters[PRIMARY_ADMIN] = true;
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
    // CORE FUNCTIONS - STUB IMPLEMENTATION
    // ============================================================
    
    /**
     * @notice Register DePIN asset
     */
    function registerAsset(
        AssetType assetType,
        bytes32 hardwareHash,
        bytes32 locationHash,
        bytes32 firmwareHash
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        notInEmergency 
        returns (uint256 assetId) 
    {
        require(hardwareHashToAssetId[hardwareHash] == 0, "DePinAdapter: hardware exists");
        
        assetId = _assetIdCounter++;
        
        assets[assetId] = DePinAsset({
            assetId: assetId,
            assetType: assetType,
            status: AssetStatus.REGISTERED,
            owner: msg.sender,
            hardwareHash: hardwareHash,
            locationHash: locationHash,
            firmwareHash: firmwareHash,
            registeredAt: block.timestamp,
            lastAttestationAt: 0,
            uptimeSeconds: 0,
            isVerified: false
        });
        
        ownerAssets[msg.sender].push(assetId);
        hardwareHashToAssetId[hardwareHash] = assetId;
        
        emit AssetRegistered(assetId, assetType, msg.sender, hardwareHash);
        
        return assetId;
    }
    
    /**
     * @notice Attest asset hardware (TEE verification)
     */
    function attestAsset(
        uint256 assetId,
        bytes32 attestationHash,
        bytes32 proofHash
    ) 
        external 
        nonReentrant 
        onlyAuthorizedAttester 
        whenNotPaused 
        notInEmergency 
        returns (uint256 attestationId) 
    {
        require(assets[assetId].status != AssetStatus.DECOMMISSIONED, "DePinAdapter: decommissioned");
        
        attestationId = _attestationIdCounter++;
        
        AttestationRecord memory attestation = AttestationRecord({
            attestationId: attestationId,
            assetId: assetId,
            attestationHash: attestationHash,
            proofHash: proofHash,
            attester: msg.sender,
            timestamp: block.timestamp,
            isValid: true
        });
        
        assetAttestations[assetId].push(attestation);
        
        assets[assetId].status = AssetStatus.ATTESTED;
        assets[assetId].lastAttestationAt = block.timestamp;
        assets[assetId].isVerified = true;
        
        emit AssetAttested(attestationId, assetId, msg.sender);
        
        return attestationId;
    }
    
    /**
     * @notice Record resource contribution
     */
    function recordContribution(
        uint256 assetId,
        uint256 computeUnits,
        uint256 storageBytes,
        uint256 bandwidthBytes,
        uint256 periodStart,
        uint256 periodEnd,
        uint256 rewardAmount
    ) 
        external 
        nonReentrant 
        onlyOwner 
        whenNotPaused 
        returns (uint256 contributionId) 
    {
        require(assets[assetId].isVerified, "DePinAdapter: not verified");
        
        contributionId = _contributionIdCounter++;
        
        ResourceContribution memory contribution = ResourceContribution({
            contributionId: contributionId,
            assetId: assetId,
            computeUnits: computeUnits,
            storageBytes: storageBytes,
            bandwidthBytes: bandwidthBytes,
            periodStart: periodStart,
            periodEnd: periodEnd,
            rewardAmount: rewardAmount
        });
        
        assetContributions[assetId].push(contribution);
        
        // Update uptime
        assets[assetId].uptimeSeconds += (periodEnd - periodStart);
        
        emit ContributionRecorded(contributionId, assetId, computeUnits, rewardAmount);
        
        return contributionId;
    }
    
    /**
     * @notice Update asset status
     */
    function updateAssetStatus(
        uint256 assetId,
        AssetStatus newStatus
    ) 
        external 
        nonReentrant 
        onlyAssetOwner(assetId) 
    {
        AssetStatus oldStatus = assets[assetId].status;
        assets[assetId].status = newStatus;
        
        emit AssetStatusUpdated(assetId, oldStatus, newStatus);
    }
    
    /**
     * @notice Authorize attester
     */
    function authorizeAttester(address attester) external nonReentrant onlyOwner {
        authorizedAttesters[attester] = true;
    }
    
    /**
     * @notice Revoke attester authorization
     */
    function revokeAttester(address attester) external nonReentrant onlyOwner {
        authorizedAttesters[attester] = false;
    }
    
    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================
    
    function getAsset(uint256 assetId) external view returns (DePinAsset memory) {
        return assets[assetId];
    }
    
    function getOwnerAssets(address owner) external view returns (uint256[] memory) {
        return ownerAssets[owner];
    }
    
    function getAssetAttestations(uint256 assetId) external view returns (AttestationRecord[] memory) {
        return assetAttestations[assetId];
    }
    
    function getAssetContributions(uint256 assetId) external view returns (ResourceContribution[] memory) {
        return assetContributions[assetId];
    }
    
    function getTotalAssets() external view returns (uint256) {
        return _assetIdCounter;
    }
    
    function isAttesterAuthorized(address attester) external view returns (bool) {
        return authorizedAttesters[attester];
    }
}
