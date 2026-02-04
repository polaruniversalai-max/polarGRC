// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract PolarUniversalGRC is Ownable, AccessControl, ReentrancyGuard {
    bytes32 public constant AUTHORIZED_AUDITOR_ROLE = keccak256("AUTHORIZED_AUDITOR_ROLE");
    
    enum Sector { FDA, ERCOT, HIPAA, TITLE_IX }
    enum ComplianceStatus { COMPLIANT, ARREARS, NON_COMPLIANT, CRITICAL }
    
    struct ComplianceRecord {
        uint256 id;
        Sector sector;
        ComplianceStatus status;
        uint256 fineAmount;
        string regulatoryRef;
        uint256 timestamp;
        address auditor;
        bool humanApproved;
        bytes32 evidenceHash;
    }
    
    struct AuditBatch {
        uint256 batchId;
        uint256[] recordIds;
        uint256 timestamp;
        address submittedBy;
        bool finalized;
    }
    
    uint256 private _recordIdCounter;
    uint256 private _batchIdCounter;
    
    mapping(uint256 => ComplianceRecord) public complianceRecords;
    mapping(uint256 => AuditBatch) public auditBatches;
    mapping(address => uint256) public auditorRecordCount;
    mapping(Sector => uint256) public sectorFineTotal;
    
    uint256 public constant HITL_THRESHOLD = 25000 ether;
    
    event ComplianceRecordCreated(
        uint256 indexed recordId,
        Sector indexed sector,
        ComplianceStatus status,
        uint256 fineAmount,
        string regulatoryRef,
        address indexed auditor
    );
    
    event ComplianceRecordUpdated(
        uint256 indexed recordId,
        ComplianceStatus oldStatus,
        ComplianceStatus newStatus,
        address indexed updatedBy
    );
    
    event HITLApprovalRequired(
        uint256 indexed recordId,
        uint256 fineAmount,
        string reason
    );
    
    event HITLApprovalGranted(
        uint256 indexed recordId,
        address indexed approver,
        uint256 timestamp
    );
    
    event AuditBatchSubmitted(
        uint256 indexed batchId,
        uint256 recordCount,
        address indexed submittedBy
    );
    
    event AuditBatchFinalized(
        uint256 indexed batchId,
        address indexed finalizedBy,
        uint256 timestamp
    );
    
    event AuditorAdded(address indexed auditor, address indexed addedBy);
    event AuditorRemoved(address indexed auditor, address indexed removedBy);
    
    constructor(address initialOwner) Ownable(initialOwner) {
        _grantRole(DEFAULT_ADMIN_ROLE, initialOwner);
        _grantRole(AUTHORIZED_AUDITOR_ROLE, initialOwner);
    }
    
    modifier onlyAuditor() {
        require(
            hasRole(AUTHORIZED_AUDITOR_ROLE, msg.sender) || owner() == msg.sender,
            "PolarUniversalGRC: caller is not an authorized auditor"
        );
        _;
    }
    
    function addAuditor(address auditor) external onlyOwner {
        require(auditor != address(0), "PolarUniversalGRC: zero address");
        grantRole(AUTHORIZED_AUDITOR_ROLE, auditor);
        emit AuditorAdded(auditor, msg.sender);
    }
    
    function removeAuditor(address auditor) external onlyOwner {
        require(auditor != address(0), "PolarUniversalGRC: zero address");
        revokeRole(AUTHORIZED_AUDITOR_ROLE, auditor);
        emit AuditorRemoved(auditor, msg.sender);
    }
    
    function createComplianceRecord(
        Sector sector,
        ComplianceStatus status,
        uint256 fineAmount,
        string calldata regulatoryRef,
        bytes32 evidenceHash
    ) external onlyAuditor nonReentrant returns (uint256) {
        uint256 recordId = _recordIdCounter++;
        
        bool requiresHITL = fineAmount >= HITL_THRESHOLD;
        
        complianceRecords[recordId] = ComplianceRecord({
            id: recordId,
            sector: sector,
            status: status,
            fineAmount: fineAmount,
            regulatoryRef: regulatoryRef,
            timestamp: block.timestamp,
            auditor: msg.sender,
            humanApproved: !requiresHITL,
            evidenceHash: evidenceHash
        });
        
        auditorRecordCount[msg.sender]++;
        sectorFineTotal[sector] += fineAmount;
        
        emit ComplianceRecordCreated(
            recordId,
            sector,
            status,
            fineAmount,
            regulatoryRef,
            msg.sender
        );
        
        if (requiresHITL) {
            emit HITLApprovalRequired(
                recordId,
                fineAmount,
                "Fine exceeds HITL threshold"
            );
        }
        
        return recordId;
    }
    
    function approveHITLRecord(uint256 recordId) external onlyOwner {
        ComplianceRecord storage record = complianceRecords[recordId];
        require(record.timestamp > 0, "PolarUniversalGRC: record does not exist");
        require(!record.humanApproved, "PolarUniversalGRC: already approved");
        
        record.humanApproved = true;
        
        emit HITLApprovalGranted(recordId, msg.sender, block.timestamp);
    }
    
    function updateComplianceStatus(
        uint256 recordId,
        ComplianceStatus newStatus
    ) external onlyAuditor {
        ComplianceRecord storage record = complianceRecords[recordId];
        require(record.timestamp > 0, "PolarUniversalGRC: record does not exist");
        
        ComplianceStatus oldStatus = record.status;
        record.status = newStatus;
        
        emit ComplianceRecordUpdated(recordId, oldStatus, newStatus, msg.sender);
    }
    
    function submitAuditBatch(
        uint256[] calldata recordIds
    ) external onlyAuditor nonReentrant returns (uint256) {
        require(recordIds.length > 0, "PolarUniversalGRC: empty batch");
        require(recordIds.length <= 100, "PolarUniversalGRC: batch too large");
        
        for (uint256 i = 0; i < recordIds.length; i++) {
            require(
                complianceRecords[recordIds[i]].timestamp > 0,
                "PolarUniversalGRC: invalid record in batch"
            );
        }
        
        uint256 batchId = _batchIdCounter++;
        
        auditBatches[batchId] = AuditBatch({
            batchId: batchId,
            recordIds: recordIds,
            timestamp: block.timestamp,
            submittedBy: msg.sender,
            finalized: false
        });
        
        emit AuditBatchSubmitted(batchId, recordIds.length, msg.sender);
        
        return batchId;
    }
    
    function finalizeAuditBatch(uint256 batchId) external onlyOwner {
        AuditBatch storage batch = auditBatches[batchId];
        require(batch.timestamp > 0, "PolarUniversalGRC: batch does not exist");
        require(!batch.finalized, "PolarUniversalGRC: already finalized");
        
        for (uint256 i = 0; i < batch.recordIds.length; i++) {
            ComplianceRecord storage record = complianceRecords[batch.recordIds[i]];
            require(record.humanApproved, "PolarUniversalGRC: unapproved record in batch");
        }
        
        batch.finalized = true;
        
        emit AuditBatchFinalized(batchId, msg.sender, block.timestamp);
    }
    
    function getComplianceRecord(uint256 recordId) external view returns (ComplianceRecord memory) {
        return complianceRecords[recordId];
    }
    
    function getAuditBatch(uint256 batchId) external view returns (AuditBatch memory) {
        return auditBatches[batchId];
    }
    
    function getTotalRecords() external view returns (uint256) {
        return _recordIdCounter;
    }
    
    function getTotalBatches() external view returns (uint256) {
        return _batchIdCounter;
    }
    
    function getSectorFineTotal(Sector sector) external view returns (uint256) {
        return sectorFineTotal[sector];
    }
    
    function isAuditor(address account) external view returns (bool) {
        return hasRole(AUTHORIZED_AUDITOR_ROLE, account);
    }
    
    function supportsInterface(bytes4 interfaceId) 
        public 
        view 
        override(AccessControl) 
        returns (bool) 
    {
        return super.supportsInterface(interfaceId);
    }
}
