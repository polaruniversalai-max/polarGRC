"""
Custom Exceptions for Confidential GRC Engine
"""

from typing import Optional, Dict, Any


class GRCEngineException(Exception):
    """Base exception for all GRC Engine errors."""
    
    def __init__(self, message: str, code: str, context: Optional[Dict[str, Any]] = None):
        self.message = message
        self.code = code
        self.context = context or {}
        super().__init__(self.message)
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            "error_type": self.__class__.__name__,
            "code": self.code,
            "message": self.message,
            "context": self.context
        }


class ComplianceViolation(GRCEngineException):
    """Raised when a compliance check fails."""
    
    def __init__(self, regulation: str, violation_type: str, details: str, 
                 severity: str = "CRITICAL", context: Optional[Dict[str, Any]] = None):
        self.regulation = regulation
        self.violation_type = violation_type
        self.severity = severity
        message = f"[{severity}] {regulation} Violation: {violation_type} - {details}"
        super().__init__(message, f"COMPLIANCE_{violation_type.upper()}", context)


class HardwareMismatch(GRCEngineException):
    """Raised when hardware security requirements are not met."""
    
    def __init__(self, expected: str, actual: str, component: str,
                 context: Optional[Dict[str, Any]] = None):
        self.expected = expected
        self.actual = actual
        self.component = component
        message = f"Hardware mismatch in {component}: expected {expected}, got {actual}"
        super().__init__(message, "HARDWARE_MISMATCH", context)


class CryptographicFailure(GRCEngineException):
    """Raised when a cryptographic operation fails."""
    
    def __init__(self, operation: str, reason: str, 
                 context: Optional[Dict[str, Any]] = None):
        self.operation = operation
        self.reason = reason
        message = f"Cryptographic failure in {operation}: {reason}"
        super().__init__(message, "CRYPTO_FAILURE", context)


class EnclaveIntegrityError(GRCEngineException):
    """Raised when TEE/enclave integrity verification fails."""
    
    def __init__(self, enclave_id: str, attestation_failure: str,
                 context: Optional[Dict[str, Any]] = None):
        self.enclave_id = enclave_id
        self.attestation_failure = attestation_failure
        message = f"Enclave {enclave_id} integrity compromised: {attestation_failure}"
        super().__init__(message, "ENCLAVE_INTEGRITY", context)


class SequencerError(GRCEngineException):
    """Raised when decentralized sequencer operations fail."""
    
    def __init__(self, operation: str, batch_id: Optional[str] = None,
                 context: Optional[Dict[str, Any]] = None):
        self.operation = operation
        self.batch_id = batch_id
        message = f"Sequencer error in {operation}" + (f" for batch {batch_id}" if batch_id else "")
        super().__init__(message, "SEQUENCER_ERROR", context)


class DocumentExtractionError(GRCEngineException):
    """Raised when document intelligence extraction fails."""
    
    def __init__(self, document_id: str, stage: str, reason: str,
                 context: Optional[Dict[str, Any]] = None):
        self.document_id = document_id
        self.stage = stage
        message = f"Document extraction failed for {document_id} at {stage}: {reason}"
        super().__init__(message, "DOC_EXTRACTION", context)
