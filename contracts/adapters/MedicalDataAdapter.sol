// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title MedicalDataAdapter
 * @author PolarUniversal Team
 * @notice Medical Data Compliance Adapter - HIPAA/HITECH Compliant
 * @dev v3.1.0-Whale: Cross-Sector Adapter Stub
 * 
 * REGULATORY FRAMEWORK:
 * - HIPAA (Health Insurance Portability and Accountability Act)
 * - HITECH (Health Information Technology for Economic and Clinical Health)
 * - HL7 FHIR Standard Compatibility
 * - Patient Consent Management
 * 
 * STUB: Core structure implemented, ready for sector-specific expansion
 */
contract MedicalDataAdapter is Ownable2Step, ReentrancyGuard, Pausable {
    
    string public constant VERSION = "3.1.0-WHALE";
    string public constant ADAPTER_NAME = "MedicalDataAdapter";
    string public constant REGULATORY_FRAMEWORK = "HIPAA_HITECH_FHIR";
    
    address public constant PRIMARY_ADMIN = 0x9d91fC37529BD0c6D020dFf6519ee699C7e0A783;
    address public globalRegistry;
    bool public emergencyMode;
    
    // ============================================================
    // STRUCTS - HIPAA COMPLIANT
    // ============================================================
    
    struct PatientRecord {
        uint256 recordId;
        bytes32 patientIdHash;          // De-identified patient ID
        bytes32 medicalDataHash;        // Encrypted medical data hash
        bytes32 consentHash;            // Patient consent record
        address provider;
        uint256 createdAt;
        uint256 lastAccessedAt;
        bool isActive;
    }
    
    struct ConsentRecord {
        uint256 consentId;
        bytes32 patientIdHash;
        address authorizedProvider;
        uint256 grantedAt;
        uint256 expiresAt;
        bool isRevoked;
    }
    
    // ============================================================
    // STATE VARIABLES
    // ============================================================
    
    uint256 private _recordIdCounter;
    uint256 private _consentIdCounter;
    
    mapping(uint256 => PatientRecord) public patientRecords;
    mapping(bytes32 => uint256[]) public patientRecordsByHash;
    mapping(uint256 => ConsentRecord) public consents;
    mapping(address => bool) public authorizedProviders;
    
    // ============================================================
    // EVENTS
    // ============================================================
    
    event PatientRecordCreated(
        uint256 indexed recordId,
        bytes32 indexed patientIdHash,
        address indexed provider
    );
    
    event ConsentGranted(
        uint256 indexed consentId,
        bytes32 indexed patientIdHash,
        address indexed provider
    );
    
    event ConsentRevoked(
        uint256 indexed consentId,
        bytes32 indexed patientIdHash
    );
    
    event EmergencyModeActivated(address indexed admin, uint256 timestamp);
    
    // ============================================================
    // MODIFIERS
    // ============================================================
    
    modifier onlyPrimaryAdmin() {
        require(msg.sender == PRIMARY_ADMIN, "MedicalAdapter: not primary admin");
        _;
    }
    
    modifier onlyAuthorizedProvider() {
        require(authorizedProviders[msg.sender], "MedicalAdapter: not authorized");
        _;
    }
    
    modifier notInEmergency() {
        require(!emergencyMode, "MedicalAdapter: emergency mode");
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
        authorizedProviders[PRIMARY_ADMIN] = true;
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
     * @notice Create patient record (HIPAA compliant)
     */
    function createPatientRecord(
        bytes32 patientIdHash,
        bytes32 medicalDataHash,
        bytes32 consentHash
    ) 
        external 
        nonReentrant 
        onlyAuthorizedProvider 
        whenNotPaused 
        notInEmergency 
        returns (uint256 recordId) 
    {
        recordId = _recordIdCounter++;
        
        patientRecords[recordId] = PatientRecord({
            recordId: recordId,
            patientIdHash: patientIdHash,
            medicalDataHash: medicalDataHash,
            consentHash: consentHash,
            provider: msg.sender,
            createdAt: block.timestamp,
            lastAccessedAt: block.timestamp,
            isActive: true
        });
        
        patientRecordsByHash[patientIdHash].push(recordId);
        
        emit PatientRecordCreated(recordId, patientIdHash, msg.sender);
        
        return recordId;
    }
    
    /**
     * @notice Grant consent for data access
     */
    function grantConsent(
        bytes32 patientIdHash,
        address authorizedProvider,
        uint256 validityPeriod
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        notInEmergency 
        returns (uint256 consentId) 
    {
        consentId = _consentIdCounter++;
        
        consents[consentId] = ConsentRecord({
            consentId: consentId,
            patientIdHash: patientIdHash,
            authorizedProvider: authorizedProvider,
            grantedAt: block.timestamp,
            expiresAt: block.timestamp + validityPeriod,
            isRevoked: false
        });
        
        emit ConsentGranted(consentId, patientIdHash, authorizedProvider);
        
        return consentId;
    }
    
    /**
     * @notice Revoke consent
     */
    function revokeConsent(uint256 consentId) 
        external 
        nonReentrant 
        whenNotPaused 
    {
        require(!consents[consentId].isRevoked, "MedicalAdapter: already revoked");
        
        consents[consentId].isRevoked = true;
        
        emit ConsentRevoked(consentId, consents[consentId].patientIdHash);
    }
    
    /**
     * @notice Authorize healthcare provider
     */
    function authorizeProvider(address provider) external nonReentrant onlyOwner {
        authorizedProviders[provider] = true;
    }
    
    /**
     * @notice Revoke provider authorization
     */
    function revokeProvider(address provider) external nonReentrant onlyOwner {
        authorizedProviders[provider] = false;
    }
    
    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================
    
    function getPatientRecord(uint256 recordId) external view returns (PatientRecord memory) {
        return patientRecords[recordId];
    }
    
    function getConsent(uint256 consentId) external view returns (ConsentRecord memory) {
        return consents[consentId];
    }
    
    function getPatientRecordsByHash(bytes32 patientIdHash) external view returns (uint256[] memory) {
        return patientRecordsByHash[patientIdHash];
    }
    
    function getTotalRecords() external view returns (uint256) {
        return _recordIdCounter;
    }
    
    function isProviderAuthorized(address provider) external view returns (bool) {
        return authorizedProviders[provider];
    }
}
