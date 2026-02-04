"""
Gemini Multimodal Pipeline - Document Intelligence for FDA 21 CFR Part 11
Implements asynchronous extraction mapping to Regulatory State Machine.
Integrated with Comet Opik for enterprise observability and Chain of Thought logging.
"""

import asyncio
import hashlib
import json
import os
import re
import time
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Optional, Dict, Any, List, Tuple, Callable
from enum import Enum
from datetime import datetime

try:
    import google.generativeai as genai
    GEMINI_AVAILABLE = True
except ImportError:
    GEMINI_AVAILABLE = False

try:
    import opik
    from opik import track
    OPIK_AVAILABLE = True
except ImportError:
    OPIK_AVAILABLE = False
    def track(*args, **kwargs):
        def decorator(func):
            return func
        return decorator

from enterprise_core.exceptions import DocumentExtractionError, ComplianceViolation

# Clinical Emerald Green ANSI color for terminal output
EMERALD = "\033[38;5;48m"
RESET = "\033[0m"
BOLD = "\033[1m"


class FDA21CFR11State(Enum):
    """FDA 21 CFR Part 11 compliance states for electronic records."""
    UNKNOWN = "unknown"
    PENDING_REVIEW = "pending_review"
    SIGNATURE_REQUIRED = "signature_required"
    SIGNATURE_VERIFIED = "signature_verified"
    AUDIT_TRAIL_INCOMPLETE = "audit_trail_incomplete"
    AUDIT_TRAIL_COMPLETE = "audit_trail_complete"
    VALIDATION_REQUIRED = "validation_required"
    VALIDATED = "validated"
    NON_COMPLIANT = "non_compliant"
    COMPLIANT = "compliant"
    ARCHIVED = "archived"


@dataclass
class ExtractionResult:
    """Result from document extraction process."""
    document_id: str
    extracted_fields: Dict[str, Any]
    confidence_scores: Dict[str, float]
    regulatory_entities: List[Dict[str, Any]]
    processing_time_ms: int
    model_version: str
    extraction_timestamp: int


@dataclass
class RegulatoryStateMachine:
    """
    State machine tracking FDA 21 CFR Part 11 compliance status.
    Manages transitions based on document extraction results.
    """
    document_id: str
    current_state: FDA21CFR11State = FDA21CFR11State.UNKNOWN
    state_history: List[Dict[str, Any]] = field(default_factory=list)
    compliance_checklist: Dict[str, bool] = field(default_factory=dict)
    signatures: List[Dict[str, Any]] = field(default_factory=list)
    audit_entries: List[Dict[str, Any]] = field(default_factory=list)
    validation_records: List[Dict[str, Any]] = field(default_factory=list)
    
    REQUIRED_CHECKS = [
        "electronic_signature_present",
        "signature_linked_to_record",
        "signature_datetime_stamped",
        "audit_trail_present",
        "audit_trail_computer_generated",
        "audit_trail_tamper_evident",
        "system_validation_documented",
        "access_controls_documented",
        "data_integrity_verified"
    ]
    
    def __post_init__(self):
        for check in self.REQUIRED_CHECKS:
            if check not in self.compliance_checklist:
                self.compliance_checklist[check] = False
    
    def transition_to(self, new_state: FDA21CFR11State, reason: str) -> bool:
        """Transition to new state with audit trail entry."""
        valid_transitions = self._get_valid_transitions()
        
        if new_state not in valid_transitions.get(self.current_state, []):
            return False
        
        self.state_history.append({
            "from_state": self.current_state.value,
            "to_state": new_state.value,
            "reason": reason,
            "timestamp": int(time.time() * 1000)
        })
        
        self.current_state = new_state
        return True
    
    def _get_valid_transitions(self) -> Dict[FDA21CFR11State, List[FDA21CFR11State]]:
        """Define valid state transitions per FDA requirements."""
        return {
            FDA21CFR11State.UNKNOWN: [
                FDA21CFR11State.PENDING_REVIEW,
                FDA21CFR11State.NON_COMPLIANT
            ],
            FDA21CFR11State.PENDING_REVIEW: [
                FDA21CFR11State.SIGNATURE_REQUIRED,
                FDA21CFR11State.AUDIT_TRAIL_INCOMPLETE,
                FDA21CFR11State.NON_COMPLIANT
            ],
            FDA21CFR11State.SIGNATURE_REQUIRED: [
                FDA21CFR11State.SIGNATURE_VERIFIED,
                FDA21CFR11State.NON_COMPLIANT
            ],
            FDA21CFR11State.SIGNATURE_VERIFIED: [
                FDA21CFR11State.AUDIT_TRAIL_INCOMPLETE,
                FDA21CFR11State.AUDIT_TRAIL_COMPLETE
            ],
            FDA21CFR11State.AUDIT_TRAIL_INCOMPLETE: [
                FDA21CFR11State.AUDIT_TRAIL_COMPLETE,
                FDA21CFR11State.NON_COMPLIANT
            ],
            FDA21CFR11State.AUDIT_TRAIL_COMPLETE: [
                FDA21CFR11State.VALIDATION_REQUIRED,
                FDA21CFR11State.VALIDATED
            ],
            FDA21CFR11State.VALIDATION_REQUIRED: [
                FDA21CFR11State.VALIDATED,
                FDA21CFR11State.NON_COMPLIANT
            ],
            FDA21CFR11State.VALIDATED: [
                FDA21CFR11State.COMPLIANT,
                FDA21CFR11State.NON_COMPLIANT
            ],
            FDA21CFR11State.COMPLIANT: [
                FDA21CFR11State.ARCHIVED,
                FDA21CFR11State.NON_COMPLIANT
            ],
            FDA21CFR11State.NON_COMPLIANT: [
                FDA21CFR11State.PENDING_REVIEW
            ],
            FDA21CFR11State.ARCHIVED: []
        }
    
    def add_signature(self, signer_id: str, signature_hash: str, 
                      meaning: str, timestamp: int) -> None:
        """Add electronic signature with meaning and timestamp."""
        self.signatures.append({
            "signer_id": signer_id,
            "signature_hash": signature_hash,
            "meaning": meaning,
            "timestamp": timestamp,
            "linked_to_record": True
        })
        self.compliance_checklist["electronic_signature_present"] = True
        self.compliance_checklist["signature_linked_to_record"] = True
        self.compliance_checklist["signature_datetime_stamped"] = True
    
    def add_audit_entry(self, action: str, user_id: str, 
                        details: Dict[str, Any]) -> None:
        """Add audit trail entry."""
        entry = {
            "action": action,
            "user_id": user_id,
            "details": details,
            "timestamp": int(time.time() * 1000),
            "computer_generated": True,
            "sequence_number": len(self.audit_entries) + 1
        }
        entry["hash"] = hashlib.sha256(
            json.dumps(entry, sort_keys=True).encode()
        ).hexdigest()[:16]
        
        self.audit_entries.append(entry)
        self.compliance_checklist["audit_trail_present"] = True
        self.compliance_checklist["audit_trail_computer_generated"] = True
    
    def get_compliance_score(self) -> float:
        """Calculate overall compliance score (0.0 - 1.0)."""
        passed = sum(1 for v in self.compliance_checklist.values() if v)
        return passed / len(self.REQUIRED_CHECKS)
    
    def is_compliant(self) -> bool:
        """Check if all compliance requirements are met."""
        return all(self.compliance_checklist.values())


class DocumentIntelligenceBase(ABC):
    """Abstract base class for document intelligence operations."""
    
    @abstractmethod
    async def extract_regulatory_fields(self, document_text: str, 
                                         document_type: str) -> ExtractionResult:
        """Extract regulatory-relevant fields from document."""
        pass
    
    @abstractmethod
    async def map_to_state_machine(self, extraction: ExtractionResult,
                                    state_machine: RegulatoryStateMachine) -> None:
        """Map extraction results to regulatory state machine."""
        pass


class DocumentIntelligence(DocumentIntelligenceBase):
    """
    Production-grade Gemini-powered document intelligence for FDA compliance.
    Implements asynchronous extraction with regulatory state machine mapping.
    """
    
    EXTRACTION_PROMPT_TEMPLATE = """
    Analyze this pharmaceutical/clinical document and extract structured regulatory information.
    
    Document Type: {document_type}
    
    Document Content:
    {document_text}
    
    Extract the following in JSON format:
    {{
        "electronic_signatures": [
            {{"signer_name": "", "signer_id": "", "role": "", "date": "", "meaning": ""}}
        ],
        "audit_trail_indicators": {{
            "has_timestamps": boolean,
            "has_user_ids": boolean,
            "has_action_records": boolean,
            "is_sequential": boolean
        }},
        "validation_evidence": {{
            "system_validated": boolean,
            "validation_protocol_ref": "",
            "validation_date": ""
        }},
        "data_integrity_markers": {{
            "checksums_present": boolean,
            "version_control": boolean,
            "access_controls_mentioned": boolean
        }},
        "regulatory_references": ["list of CFR/FDA references found"],
        "compliance_gaps": ["list of potential compliance issues"],
        "record_type": "clinical_trial|manufacturing|laboratory|other",
        "sensitivity_level": "public|internal|confidential|restricted"
    }}
    
    Be precise and extract only what is explicitly stated in the document.
    """
    
    FIELD_PATTERNS = {
        "signature": r"(?:signed|signature|approved|authorized)\s*(?:by)?:?\s*([A-Za-z\s\.]+)",
        "date": r"(\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\d{4}[-/]\d{1,2}[-/]\d{1,2})",
        "batch_number": r"(?:batch|lot)\s*(?:#|no\.?|number)?:?\s*([A-Z0-9-]+)",
        "protocol": r"(?:protocol|procedure)\s*(?:#|no\.?)?:?\s*([A-Z0-9-]+)",
        "cfr_reference": r"21\s*CFR\s*(?:Part\s*)?(\d+(?:\.\d+)?)",
        "validation": r"(?:validated?|qualification)\s*(?:on|date)?:?\s*(\d{1,2}[-/]\d{1,2}[-/]\d{2,4})"
    }
    
    def __init__(self, api_key: Optional[str] = None, model_name: str = "gemini-1.5-pro"):
        self._api_key = api_key or os.environ.get("GEMINI_API_KEY")
        self._model_name = model_name
        self._model = None
        self._extraction_cache: Dict[str, ExtractionResult] = {}
        
        if GEMINI_AVAILABLE and self._api_key:
            genai.configure(api_key=self._api_key)
            self._model = genai.GenerativeModel(model_name)
    
    def _generate_document_id(self, document_text: str) -> str:
        """Generate unique document identifier from content hash."""
        content_hash = hashlib.sha256(document_text.encode()).hexdigest()[:16]
        return f"doc-{content_hash}-{int(time.time())}"
    
    def _extract_with_patterns(self, text: str) -> Dict[str, List[str]]:
        """Extract regulatory fields using regex patterns."""
        results = {}
        for field_name, pattern in self.FIELD_PATTERNS.items():
            matches = re.findall(pattern, text, re.IGNORECASE)
            results[field_name] = matches
        return results
    
    @track(name="gemini_document_extraction", project_name="polar-grc-enterprise", tags=["Polar-GRC-Resolution-V2", "gemini-ai", "fda-21-cfr-11"])
    async def extract_regulatory_fields(
        self, 
        document_text: str, 
        document_type: str = "clinical_trial"
    ) -> ExtractionResult:
        """
        Extract regulatory-relevant fields from document using Gemini.
        Falls back to pattern matching if Gemini unavailable.
        Includes Chain of Thought logging for Opik observability.
        """
        start_time = time.time()
        document_id = self._generate_document_id(document_text)
        
        # Chain of Thought: Document Analysis Phase
        chain_of_thought = {
            "phase": "document_analysis",
            "document_id": document_id,
            "document_type": document_type,
            "document_length": len(document_text),
            "extraction_method": None,
            "reasoning_steps": []
        }
        
        print(f"{EMERALD}[GEMINI] Chain of Thought: Analyzing document {document_id[:16]}...{RESET}")
        
        pattern_results = self._extract_with_patterns(document_text)
        chain_of_thought["reasoning_steps"].append({
            "step": 1,
            "action": "pattern_extraction",
            "patterns_found": {k: len(v) for k, v in pattern_results.items()},
            "timestamp_ms": int((time.time() - start_time) * 1000)
        })
        
        if self._model:
            try:
                chain_of_thought["extraction_method"] = "gemini_ai"
                chain_of_thought["reasoning_steps"].append({
                    "step": 2,
                    "action": "gemini_model_invocation",
                    "model": self._model_name,
                    "context_length": min(len(document_text), 10000)
                })
                print(f"{EMERALD}[GEMINI] Chain of Thought: Invoking {self._model_name} for deep extraction{RESET}")
                
                extracted_fields, confidence_scores = await self._gemini_extract(
                    document_text, document_type
                )
                
                chain_of_thought["reasoning_steps"].append({
                    "step": 3,
                    "action": "gemini_extraction_complete",
                    "fields_extracted": len(extracted_fields),
                    "avg_confidence": sum(confidence_scores.values()) / max(len(confidence_scores), 1)
                })
            except Exception as e:
                chain_of_thought["extraction_method"] = "pattern_fallback"
                chain_of_thought["reasoning_steps"].append({
                    "step": 2,
                    "action": "gemini_fallback",
                    "reason": str(e),
                    "fallback_to": "pattern_matching"
                })
                print(f"{EMERALD}[GEMINI] Chain of Thought: Fallback to pattern matching{RESET}")
                extracted_fields = self._pattern_to_fields(pattern_results)
                confidence_scores = {k: 0.6 for k in extracted_fields}
        else:
            chain_of_thought["extraction_method"] = "pattern_only"
            chain_of_thought["reasoning_steps"].append({
                "step": 2,
                "action": "pattern_only_extraction",
                "reason": "gemini_unavailable"
            })
            print(f"{EMERALD}[GEMINI] Chain of Thought: Pattern-only extraction (Gemini unavailable){RESET}")
            extracted_fields = self._pattern_to_fields(pattern_results)
            confidence_scores = {k: 0.7 for k in extracted_fields}
        
        regulatory_entities = self._identify_regulatory_entities(
            document_text, extracted_fields
        )
        
        chain_of_thought["reasoning_steps"].append({
            "step": 4,
            "action": "entity_identification",
            "entities_found": len(regulatory_entities),
            "entity_types": list(set(e.get("type", "UNKNOWN") for e in regulatory_entities))
        })
        
        processing_time = int((time.time() - start_time) * 1000)
        
        # Final Chain of Thought summary
        chain_of_thought["total_processing_ms"] = processing_time
        chain_of_thought["final_confidence"] = sum(confidence_scores.values()) / max(len(confidence_scores), 1)
        chain_of_thought["fda_compliance_indicators"] = {
            "signatures_found": len(extracted_fields.get("electronic_signatures", [])),
            "audit_trail_present": extracted_fields.get("audit_trail_indicators", {}).get("has_timestamps", False),
            "validation_documented": extracted_fields.get("validation_evidence", {}).get("system_validated", False)
        }
        
        print(f"{EMERALD}[GEMINI] Chain of Thought Complete: {processing_time}ms, {len(regulatory_entities)} entities{RESET}")
        print(f"{EMERALD}[GEMINI] FDA Compliance Indicators: {chain_of_thought['fda_compliance_indicators']}{RESET}")
        
        # Log Chain of Thought summary (Opik metadata logged via @track decorator)
        print(f"{EMERALD}[GEMINI] Chain of Thought Metadata: {json.dumps(chain_of_thought, indent=2)[:500]}...{RESET}")
        
        result = ExtractionResult(
            document_id=document_id,
            extracted_fields=extracted_fields,
            confidence_scores=confidence_scores,
            regulatory_entities=regulatory_entities,
            processing_time_ms=processing_time,
            model_version=self._model_name if self._model else "pattern-v1",
            extraction_timestamp=int(time.time() * 1000)
        )
        
        self._extraction_cache[document_id] = result
        
        return result
    
    async def _gemini_extract(
        self, 
        document_text: str, 
        document_type: str
    ) -> Tuple[Dict[str, Any], Dict[str, float]]:
        """Extract fields using Gemini model."""
        prompt = self.EXTRACTION_PROMPT_TEMPLATE.format(
            document_type=document_type,
            document_text=document_text[:10000]  # Limit context
        )
        
        response = await asyncio.to_thread(
            self._model.generate_content,
            prompt,
            generation_config=genai.GenerationConfig(
                temperature=0.1,
                max_output_tokens=2000
            )
        )
        
        try:
            json_match = re.search(r'\{[\s\S]*\}', response.text)
            if json_match:
                extracted = json.loads(json_match.group())
            else:
                extracted = {}
        except json.JSONDecodeError:
            extracted = {}
        
        confidence = {}
        for key in extracted:
            if isinstance(extracted[key], (list, dict)) and len(str(extracted[key])) > 2:
                confidence[key] = 0.85
            elif extracted[key]:
                confidence[key] = 0.75
            else:
                confidence[key] = 0.5
        
        return extracted, confidence
    
    def _pattern_to_fields(self, pattern_results: Dict[str, List[str]]) -> Dict[str, Any]:
        """Convert pattern matching results to structured fields."""
        return {
            "electronic_signatures": [
                {"signer_name": sig, "extracted_by": "pattern"} 
                for sig in pattern_results.get("signature", [])
            ],
            "dates_found": pattern_results.get("date", []),
            "batch_numbers": pattern_results.get("batch_number", []),
            "protocols": pattern_results.get("protocol", []),
            "cfr_references": [f"21 CFR Part {ref}" for ref in pattern_results.get("cfr_reference", [])],
            "validation_dates": pattern_results.get("validation", []),
            "audit_trail_indicators": {
                "has_timestamps": len(pattern_results.get("date", [])) > 0,
                "has_user_ids": len(pattern_results.get("signature", [])) > 0,
                "has_action_records": False,
                "is_sequential": False
            },
            "validation_evidence": {
                "system_validated": len(pattern_results.get("validation", [])) > 0,
                "validation_protocol_ref": pattern_results.get("protocol", [""])[0] if pattern_results.get("protocol") else "",
                "validation_date": pattern_results.get("validation", [""])[0] if pattern_results.get("validation") else ""
            },
            "data_integrity_markers": {
                "checksums_present": False,
                "version_control": False,
                "access_controls_mentioned": "access" in str(pattern_results).lower()
            }
        }
    
    def _identify_regulatory_entities(
        self, 
        document_text: str, 
        extracted_fields: Dict[str, Any]
    ) -> List[Dict[str, Any]]:
        """Identify regulatory entities and their relationships."""
        entities = []
        
        for sig in extracted_fields.get("electronic_signatures", []):
            entities.append({
                "type": "SIGNER",
                "value": sig.get("signer_name", ""),
                "role": sig.get("role", "unknown"),
                "regulatory_significance": "FDA_21_CFR_11.50"
            })
        
        for cfr_ref in extracted_fields.get("cfr_references", []):
            entities.append({
                "type": "REGULATION",
                "value": cfr_ref,
                "regulatory_significance": "PRIMARY_REFERENCE"
            })
        
        for batch in extracted_fields.get("batch_numbers", []):
            entities.append({
                "type": "BATCH",
                "value": batch,
                "regulatory_significance": "DSCSA_TRACEABILITY"
            })
        
        return entities
    
    async def map_to_state_machine(
        self, 
        extraction: ExtractionResult,
        state_machine: RegulatoryStateMachine
    ) -> None:
        """
        Map extraction results to regulatory state machine.
        Updates state based on compliance evidence found.
        """
        state_machine.add_audit_entry(
            action="DOCUMENT_EXTRACTION",
            user_id="SYSTEM",
            details={
                "document_id": extraction.document_id,
                "fields_extracted": len(extraction.extracted_fields),
                "model": extraction.model_version
            }
        )
        
        state_machine.transition_to(
            FDA21CFR11State.PENDING_REVIEW,
            "Document extracted and pending compliance review"
        )
        
        signatures = extraction.extracted_fields.get("electronic_signatures", [])
        if signatures:
            for sig in signatures:
                state_machine.add_signature(
                    signer_id=sig.get("signer_name", "unknown"),
                    signature_hash=hashlib.sha256(
                        json.dumps(sig).encode()
                    ).hexdigest()[:16],
                    meaning=sig.get("meaning", "approval"),
                    timestamp=int(time.time() * 1000)
                )
            
            state_machine.transition_to(
                FDA21CFR11State.SIGNATURE_REQUIRED,
                f"Found {len(signatures)} signature(s) requiring verification"
            )
            state_machine.transition_to(
                FDA21CFR11State.SIGNATURE_VERIFIED,
                "Signatures extracted and linked to record"
            )
        
        audit_indicators = extraction.extracted_fields.get("audit_trail_indicators", {})
        if audit_indicators.get("has_timestamps") and audit_indicators.get("has_user_ids"):
            state_machine.compliance_checklist["audit_trail_present"] = True
            state_machine.compliance_checklist["audit_trail_computer_generated"] = True
            
            if audit_indicators.get("is_sequential"):
                state_machine.compliance_checklist["audit_trail_tamper_evident"] = True
                state_machine.transition_to(
                    FDA21CFR11State.AUDIT_TRAIL_COMPLETE,
                    "Complete audit trail evidence found"
                )
            else:
                state_machine.transition_to(
                    FDA21CFR11State.AUDIT_TRAIL_INCOMPLETE,
                    "Partial audit trail evidence found"
                )
        
        validation = extraction.extracted_fields.get("validation_evidence", {})
        if validation.get("system_validated"):
            state_machine.compliance_checklist["system_validation_documented"] = True
            state_machine.validation_records.append({
                "protocol": validation.get("validation_protocol_ref", ""),
                "date": validation.get("validation_date", ""),
                "timestamp": int(time.time() * 1000)
            })
        
        integrity = extraction.extracted_fields.get("data_integrity_markers", {})
        if integrity.get("checksums_present"):
            state_machine.compliance_checklist["data_integrity_verified"] = True
        if integrity.get("access_controls_mentioned"):
            state_machine.compliance_checklist["access_controls_documented"] = True
        
        score = state_machine.get_compliance_score()
        
        if score >= 1.0:
            state_machine.transition_to(
                FDA21CFR11State.COMPLIANT,
                f"All compliance checks passed (score: {score:.2f})"
            )
        elif score >= 0.7:
            state_machine.transition_to(
                FDA21CFR11State.VALIDATION_REQUIRED,
                f"Partial compliance (score: {score:.2f}), validation required"
            )


class AsyncExtractionPipeline:
    """
    Asynchronous extraction pipeline for batch document processing.
    Implements parallel processing with rate limiting.
    """
    
    def __init__(self, intelligence: DocumentIntelligence, 
                 max_concurrent: int = 5):
        self._intelligence = intelligence
        self._max_concurrent = max_concurrent
        self._semaphore = asyncio.Semaphore(max_concurrent)
        self._results: Dict[str, RegulatoryStateMachine] = {}
    
    async def process_document(
        self, 
        document_text: str, 
        document_type: str = "clinical_trial"
    ) -> Tuple[ExtractionResult, RegulatoryStateMachine]:
        """Process single document with rate limiting."""
        async with self._semaphore:
            extraction = await self._intelligence.extract_regulatory_fields(
                document_text, document_type
            )
            
            state_machine = RegulatoryStateMachine(
                document_id=extraction.document_id
            )
            
            await self._intelligence.map_to_state_machine(extraction, state_machine)
            
            self._results[extraction.document_id] = state_machine
            
            return extraction, state_machine
    
    async def process_batch(
        self, 
        documents: List[Tuple[str, str]]  # (text, type) pairs
    ) -> List[Tuple[ExtractionResult, RegulatoryStateMachine]]:
        """Process multiple documents concurrently."""
        tasks = [
            self.process_document(text, doc_type) 
            for text, doc_type in documents
        ]
        return await asyncio.gather(*tasks)
