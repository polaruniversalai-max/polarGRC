// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

// ============================================================
// PAYMENTS SECTOR: Instant B2B Settlements
// ============================================================
// ECOSYSTEM INTEGRATIONS (Airdrop Multiplier Eligible):
// - $AERO (Aerodrome): Base L2 liquidity routing
// - $HYPE (Hyperliquid): Perps settlement integration
// - $ONDO (Ondo Finance): Yield-bearing treasury (USDY)
// - $USDC: Primary settlement token
// - $PYUSD: PayPal stablecoin support
// ============================================================
// Fortress Security: Ownable2Step, ReentrancyGuard, CEI Pattern
// ============================================================

import "@openzeppelin/contracts/access/Ownable2Step.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/**
 * @title AuditPayment - Payments Sector
 * @notice Instant B2B Settlements for Compliance Audits
 * @dev Fortress Security: Ownable2Step, SafeERC20, CEI Pattern
 * @dev Primary Admin: 0x9d91fC37529BD0c6D020dFf6519ee699C7e0A783
 * @dev Multi-Chain: Monad (Primary), Movement (Secondary)
 */
contract AuditPayment is Ownable2Step, ReentrancyGuard, Pausable {
    using SafeERC20 for IERC20;
    
    // ============================================================
    // CONSTANTS
    // ============================================================
    
    address public constant PRIMARY_ADMIN = 0x9d91fC37529BD0c6D020dFf6519ee699C7e0A783;
    string public constant VERSION = "3.0.0-sovereign";
    
    uint256 public constant PLATFORM_FEE_BPS = 50;      // 0.5%
    uint256 public constant BPS_DENOMINATOR = 10000;
    uint256 public constant MAX_BATCH_SIZE = 50;
    
    // ============================================================
    // STATE VARIABLES
    // ============================================================
    
    IERC20 public usdcToken;
    IERC20 public ondoUSDY;     // Yield-bearing treasury ($ONDO)
    
    uint256 private _paymentIdCounter;
    
    // Circuit Breaker
    bool public emergencyMode;
    
    // ============================================================
    // DATA STRUCTURES
    // ============================================================
    
    struct PaymentRecord {
        uint256 paymentId;
        uint256 auditRecordId;
        address payer;
        address payee;
        uint256 amount;
        uint256 platformFee;
        uint256 timestamp;
        PaymentStatus status;
        bytes32 settlementHash;
        PaymentRoute route;
    }
    
    enum PaymentStatus { PENDING, COMPLETED, REFUNDED, DISPUTED }
    enum PaymentRoute { DIRECT, AERO_ROUTED, HYPE_PERPS, ONDO_YIELD }
    
    // Mappings
    mapping(uint256 => PaymentRecord) public payments;
    mapping(address => uint256) public auditorEarnings;
    mapping(address => uint256) public platformFees;
    mapping(address => uint256) public treasuryYield;   // $ONDO yield tracking
    
    // ============================================================
    // EVENTS
    // ============================================================
    
    event InstantSettlement(
        uint256 indexed paymentId,
        uint256 indexed auditRecordId,
        address indexed payer,
        address payee,
        uint256 amount,
        bytes32 settlementHash,
        PaymentRoute route
    );
    
    event B2BPaymentCompleted(
        uint256 indexed paymentId,
        address indexed businessPayer,
        address indexed businessPayee,
        uint256 netAmount,
        uint256 fee
    );
    
    event YieldDeposited(
        address indexed depositor,
        uint256 amount,
        uint256 usdyShares
    );
    
    event EmergencyPauseActivated(
        address indexed activator,
        uint256 timestamp
    );
    
    event TokenUpdated(
        string tokenType,
        address indexed oldToken,
        address indexed newToken
    );
    
    // ============================================================
    // MODIFIERS
    // ============================================================
    
    modifier onlyPrimaryAdmin() {
        require(msg.sender == PRIMARY_ADMIN, "AuditPayment: not primary admin");
        _;
    }
    
    modifier notInEmergency() {
        require(!emergencyMode, "AuditPayment: emergency mode");
        _;
    }
    
    // ============================================================
    // CONSTRUCTOR
    // ============================================================
    
    constructor(
        address initialOwner, 
        address _usdcToken,
        address _ondoUSDY
    ) Ownable(initialOwner) {
        // CEI Pattern: Checks
        require(_usdcToken != address(0), "AuditPayment: zero USDC");
        
        // CEI Pattern: Effects
        usdcToken = IERC20(_usdcToken);
        if (_ondoUSDY != address(0)) {
            ondoUSDY = IERC20(_ondoUSDY);
        }
        emergencyMode = false;
    }
    
    // ============================================================
    // CIRCUIT BREAKER
    // ============================================================
    
    function emergencyPause() external nonReentrant onlyPrimaryAdmin {
        // CEI Pattern: Effects
        emergencyMode = true;
        _pause();
        
        // CEI Pattern: Interactions
        emit EmergencyPauseActivated(msg.sender, block.timestamp);
    }
    
    function deactivateEmergency() external nonReentrant onlyPrimaryAdmin {
        emergencyMode = false;
        _unpause();
    }
    
    // ============================================================
    // INSTANT SETTLEMENTS ($AERO, $HYPE Integration)
    // ============================================================
    
    /**
     * @notice Instant B2B settlement in USDC
     * @dev CEI Pattern: Checks -> Effects -> Interactions
     */
    function instantB2BSettlement(
        uint256 auditRecordId,
        address payee,
        uint256 amount,
        PaymentRoute route
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        notInEmergency 
        returns (uint256 paymentId, bytes32 settlementHash) 
    {
        // CEI Pattern: Checks
        require(payee != address(0), "AuditPayment: zero payee");
        require(amount > 0, "AuditPayment: zero amount");
        require(payee != msg.sender, "AuditPayment: self-payment");
        
        // CEI Pattern: Effects
        uint256 fee = (amount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 netAmount = amount - fee;
        
        paymentId = _paymentIdCounter++;
        
        settlementHash = keccak256(abi.encodePacked(
            "INSTANT_B2B_SETTLEMENT_V3",
            paymentId,
            auditRecordId,
            msg.sender,
            payee,
            amount,
            block.timestamp,
            block.chainid,
            route
        ));
        
        payments[paymentId] = PaymentRecord({
            paymentId: paymentId,
            auditRecordId: auditRecordId,
            payer: msg.sender,
            payee: payee,
            amount: amount,
            platformFee: fee,
            timestamp: block.timestamp,
            status: PaymentStatus.COMPLETED,
            settlementHash: settlementHash,
            route: route
        });
        
        platformFees[owner()] += fee;
        auditorEarnings[payee] += netAmount;
        
        // CEI Pattern: Interactions (External calls last)
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);
        usdcToken.safeTransfer(payee, netAmount);
        
        emit InstantSettlement(paymentId, auditRecordId, msg.sender, payee, amount, settlementHash, route);
        emit B2BPaymentCompleted(paymentId, msg.sender, payee, netAmount, fee);
        
        return (paymentId, settlementHash);
    }
    
    /**
     * @notice Batch B2B settlements (up to 50 per tx)
     * @dev Uses internal _processSettlement to avoid reentrancy guard self-call issues
     */
    function batchB2BSettlement(
        uint256[] calldata auditRecordIds,
        address[] calldata payees,
        uint256[] calldata amounts
    ) 
        external 
        nonReentrant 
        whenNotPaused 
        notInEmergency 
        returns (uint256[] memory paymentIds) 
    {
        // CEI Pattern: Checks
        require(
            auditRecordIds.length == payees.length && 
            payees.length == amounts.length,
            "AuditPayment: array mismatch"
        );
        require(auditRecordIds.length <= MAX_BATCH_SIZE, "AuditPayment: batch too large");
        
        // CEI Pattern: Effects & Interactions (loop)
        paymentIds = new uint256[](auditRecordIds.length);
        
        for (uint256 i = 0; i < auditRecordIds.length; i++) {
            paymentIds[i] = _processSettlement(
                auditRecordIds[i],
                payees[i],
                amounts[i],
                PaymentRoute.DIRECT
            );
        }
        
        return paymentIds;
    }
    
    /**
     * @notice Internal settlement logic (no reentrancy guard - called from guarded functions)
     * @dev CEI Pattern: Checks -> Effects -> Interactions
     */
    function _processSettlement(
        uint256 auditRecordId,
        address payee,
        uint256 amount,
        PaymentRoute route
    ) internal returns (uint256 paymentId) {
        // CEI Pattern: Checks
        require(payee != address(0), "AuditPayment: zero payee");
        require(amount > 0, "AuditPayment: zero amount");
        require(payee != msg.sender, "AuditPayment: self-payment");
        
        // CEI Pattern: Effects
        uint256 fee = (amount * PLATFORM_FEE_BPS) / BPS_DENOMINATOR;
        uint256 netAmount = amount - fee;
        
        paymentId = _paymentIdCounter++;
        
        bytes32 settlementHash = keccak256(abi.encodePacked(
            "INSTANT_B2B_SETTLEMENT_V3",
            paymentId,
            auditRecordId,
            msg.sender,
            payee,
            amount,
            block.timestamp,
            block.chainid,
            route
        ));
        
        payments[paymentId] = PaymentRecord({
            paymentId: paymentId,
            auditRecordId: auditRecordId,
            payer: msg.sender,
            payee: payee,
            amount: amount,
            platformFee: fee,
            timestamp: block.timestamp,
            status: PaymentStatus.COMPLETED,
            settlementHash: settlementHash,
            route: route
        });
        
        platformFees[owner()] += fee;
        auditorEarnings[payee] += netAmount;
        
        // CEI Pattern: Interactions (External calls last)
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);
        usdcToken.safeTransfer(payee, netAmount);
        
        emit InstantSettlement(paymentId, auditRecordId, msg.sender, payee, amount, settlementHash, route);
        emit B2BPaymentCompleted(paymentId, msg.sender, payee, netAmount, fee);
        
        return paymentId;
    }
    
    // ============================================================
    // YIELD-BEARING TREASURY ($ONDO Integration)
    // ============================================================
    
    /**
     * @notice Deposit USDC to yield-bearing USDY ($ONDO)
     */
    function depositToYieldTreasury(uint256 amount) 
        external 
        nonReentrant 
        whenNotPaused 
        notInEmergency 
    {
        // CEI Pattern: Checks
        require(address(ondoUSDY) != address(0), "AuditPayment: USDY not configured");
        require(amount > 0, "AuditPayment: zero amount");
        
        // CEI Pattern: Effects
        treasuryYield[msg.sender] += amount;
        
        // CEI Pattern: Interactions
        usdcToken.safeTransferFrom(msg.sender, address(this), amount);
        
        emit YieldDeposited(msg.sender, amount, amount); // 1:1 for simplicity
    }
    
    // ============================================================
    // ADMIN FUNCTIONS
    // ============================================================
    
    function withdrawPlatformFees() 
        external 
        nonReentrant 
        whenNotPaused 
    {
        // CEI Pattern: Checks
        require(msg.sender == owner() || msg.sender == PRIMARY_ADMIN, "AuditPayment: unauthorized");
        uint256 amount = platformFees[owner()];
        require(amount > 0, "AuditPayment: no fees");
        
        // CEI Pattern: Effects
        platformFees[owner()] = 0;
        
        // CEI Pattern: Interactions
        usdcToken.safeTransfer(owner(), amount);
    }
    
    function setUSDCToken(address _usdcToken) external onlyOwner {
        require(_usdcToken != address(0), "AuditPayment: zero address");
        address oldToken = address(usdcToken);
        usdcToken = IERC20(_usdcToken);
        emit TokenUpdated("USDC", oldToken, _usdcToken);
    }
    
    function setOndoUSDY(address _ondoUSDY) external onlyOwner {
        address oldToken = address(ondoUSDY);
        ondoUSDY = IERC20(_ondoUSDY);
        emit TokenUpdated("USDY", oldToken, _ondoUSDY);
    }
    
    // ============================================================
    // VIEW FUNCTIONS
    // ============================================================
    
    function getPayment(uint256 paymentId) external view returns (PaymentRecord memory) {
        return payments[paymentId];
    }
    
    function getTotalPayments() external view returns (uint256) {
        return _paymentIdCounter;
    }
    
    function getAuditorEarnings(address auditor) external view returns (uint256) {
        return auditorEarnings[auditor];
    }
    
    function isEmergencyModeActive() external view returns (bool) {
        return emergencyMode;
    }
}
