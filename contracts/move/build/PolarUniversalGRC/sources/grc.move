module polar_universal::grc {
    use std::string::{String, utf8};
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::account;

    const E_NOT_OWNER: u64 = 1;
    const E_NOT_AUDITOR: u64 = 2;
    const E_RECORD_NOT_FOUND: u64 = 3;
    const E_BATCH_NOT_FOUND: u64 = 4;
    const E_ALREADY_APPROVED: u64 = 5;
    const E_ALREADY_FINALIZED: u64 = 6;
    const E_EMPTY_BATCH: u64 = 7;
    const E_BATCH_TOO_LARGE: u64 = 8;
    const E_UNAPPROVED_RECORD: u64 = 9;
    const E_ZERO_ADDRESS: u64 = 10;

    const SECTOR_FDA: u8 = 0;
    const SECTOR_ERCOT: u8 = 1;
    const SECTOR_HIPAA: u8 = 2;
    const SECTOR_TITLE_IX: u8 = 3;

    const STATUS_COMPLIANT: u8 = 0;
    const STATUS_ARREARS: u8 = 1;
    const STATUS_NON_COMPLIANT: u8 = 2;
    const STATUS_CRITICAL: u8 = 3;

    const HITL_THRESHOLD: u64 = 25000_000000;

    struct ComplianceRecord has store, copy, drop {
        id: u64,
        sector: u8,
        status: u8,
        fine_amount: u64,
        regulatory_ref: String,
        timestamp: u64,
        auditor: address,
        human_approved: bool,
        evidence_hash: vector<u8>,
    }

    struct AuditBatch has store, copy, drop {
        batch_id: u64,
        record_ids: vector<u64>,
        timestamp: u64,
        submitted_by: address,
        finalized: bool,
    }

    struct GRCRegistry has key {
        owner: address,
        authorized_auditors: vector<address>,
        compliance_records: vector<ComplianceRecord>,
        audit_batches: vector<AuditBatch>,
        record_id_counter: u64,
        batch_id_counter: u64,
        sector_fine_totals: vector<u64>,
    }

    #[event]
    struct ComplianceRecordCreated has drop, store {
        record_id: u64,
        sector: u8,
        status: u8,
        fine_amount: u64,
        regulatory_ref: String,
        auditor: address,
    }

    #[event]
    struct ComplianceRecordUpdated has drop, store {
        record_id: u64,
        old_status: u8,
        new_status: u8,
        updated_by: address,
    }

    #[event]
    struct HITLApprovalRequired has drop, store {
        record_id: u64,
        fine_amount: u64,
        reason: String,
    }

    #[event]
    struct HITLApprovalGranted has drop, store {
        record_id: u64,
        approver: address,
        timestamp: u64,
    }

    #[event]
    struct AuditBatchSubmitted has drop, store {
        batch_id: u64,
        record_count: u64,
        submitted_by: address,
    }

    #[event]
    struct AuditBatchFinalized has drop, store {
        batch_id: u64,
        finalized_by: address,
        timestamp: u64,
    }

    #[event]
    struct AuditorAdded has drop, store {
        auditor: address,
        added_by: address,
    }

    #[event]
    struct AuditorRemoved has drop, store {
        auditor: address,
        removed_by: address,
    }

    public entry fun initialize(account: &signer) {
        let owner_addr = signer::address_of(account);
        let auditors = vector::empty<address>();
        vector::push_back(&mut auditors, owner_addr);
        
        let sector_totals = vector::empty<u64>();
        vector::push_back(&mut sector_totals, 0);
        vector::push_back(&mut sector_totals, 0);
        vector::push_back(&mut sector_totals, 0);
        vector::push_back(&mut sector_totals, 0);

        move_to(account, GRCRegistry {
            owner: owner_addr,
            authorized_auditors: auditors,
            compliance_records: vector::empty<ComplianceRecord>(),
            audit_batches: vector::empty<AuditBatch>(),
            record_id_counter: 0,
            batch_id_counter: 0,
            sector_fine_totals: sector_totals,
        });
    }

    fun is_owner(registry: &GRCRegistry, addr: address): bool {
        registry.owner == addr
    }

    fun is_auditor(registry: &GRCRegistry, addr: address): bool {
        if (registry.owner == addr) {
            return true
        };
        vector::contains(&registry.authorized_auditors, &addr)
    }

    public entry fun add_auditor(
        account: &signer,
        registry_addr: address,
        new_auditor: address
    ) acquires GRCRegistry {
        let registry = borrow_global_mut<GRCRegistry>(registry_addr);
        let sender = signer::address_of(account);
        assert!(is_owner(registry, sender), E_NOT_OWNER);
        assert!(new_auditor != @0x0, E_ZERO_ADDRESS);
        
        if (!vector::contains(&registry.authorized_auditors, &new_auditor)) {
            vector::push_back(&mut registry.authorized_auditors, new_auditor);
        };
        
        event::emit(AuditorAdded {
            auditor: new_auditor,
            added_by: sender,
        });
    }

    public entry fun remove_auditor(
        account: &signer,
        registry_addr: address,
        auditor: address
    ) acquires GRCRegistry {
        let registry = borrow_global_mut<GRCRegistry>(registry_addr);
        let sender = signer::address_of(account);
        assert!(is_owner(registry, sender), E_NOT_OWNER);
        
        let (found, index) = vector::index_of(&registry.authorized_auditors, &auditor);
        if (found) {
            vector::remove(&mut registry.authorized_auditors, index);
        };
        
        event::emit(AuditorRemoved {
            auditor: auditor,
            removed_by: sender,
        });
    }

    public entry fun create_compliance_record(
        account: &signer,
        registry_addr: address,
        sector: u8,
        status: u8,
        fine_amount: u64,
        regulatory_ref: String,
        evidence_hash: vector<u8>
    ) acquires GRCRegistry {
        let registry = borrow_global_mut<GRCRegistry>(registry_addr);
        let sender = signer::address_of(account);
        assert!(is_auditor(registry, sender), E_NOT_AUDITOR);
        
        let record_id = registry.record_id_counter;
        registry.record_id_counter = record_id + 1;
        
        let requires_hitl = fine_amount >= HITL_THRESHOLD;
        
        let record = ComplianceRecord {
            id: record_id,
            sector: sector,
            status: status,
            fine_amount: fine_amount,
            regulatory_ref: regulatory_ref,
            timestamp: timestamp::now_seconds(),
            auditor: sender,
            human_approved: !requires_hitl,
            evidence_hash: evidence_hash,
        };
        
        vector::push_back(&mut registry.compliance_records, record);
        
        let sector_total = vector::borrow_mut(&mut registry.sector_fine_totals, (sector as u64));
        *sector_total = *sector_total + fine_amount;
        
        event::emit(ComplianceRecordCreated {
            record_id: record_id,
            sector: sector,
            status: status,
            fine_amount: fine_amount,
            regulatory_ref: regulatory_ref,
            auditor: sender,
        });
        
        if (requires_hitl) {
            event::emit(HITLApprovalRequired {
                record_id: record_id,
                fine_amount: fine_amount,
                reason: utf8(b"Fine exceeds HITL threshold"),
            });
        };
    }

    public entry fun approve_hitl_record(
        account: &signer,
        registry_addr: address,
        record_id: u64
    ) acquires GRCRegistry {
        let registry = borrow_global_mut<GRCRegistry>(registry_addr);
        let sender = signer::address_of(account);
        assert!(is_owner(registry, sender), E_NOT_OWNER);
        
        let len = vector::length(&registry.compliance_records);
        assert!(record_id < len, E_RECORD_NOT_FOUND);
        
        let record = vector::borrow_mut(&mut registry.compliance_records, record_id);
        assert!(!record.human_approved, E_ALREADY_APPROVED);
        
        record.human_approved = true;
        
        event::emit(HITLApprovalGranted {
            record_id: record_id,
            approver: sender,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun update_compliance_status(
        account: &signer,
        registry_addr: address,
        record_id: u64,
        new_status: u8
    ) acquires GRCRegistry {
        let registry = borrow_global_mut<GRCRegistry>(registry_addr);
        let sender = signer::address_of(account);
        assert!(is_auditor(registry, sender), E_NOT_AUDITOR);
        
        let len = vector::length(&registry.compliance_records);
        assert!(record_id < len, E_RECORD_NOT_FOUND);
        
        let record = vector::borrow_mut(&mut registry.compliance_records, record_id);
        let old_status = record.status;
        record.status = new_status;
        
        event::emit(ComplianceRecordUpdated {
            record_id: record_id,
            old_status: old_status,
            new_status: new_status,
            updated_by: sender,
        });
    }

    public entry fun submit_audit_batch(
        account: &signer,
        registry_addr: address,
        record_ids: vector<u64>
    ) acquires GRCRegistry {
        let registry = borrow_global_mut<GRCRegistry>(registry_addr);
        let sender = signer::address_of(account);
        assert!(is_auditor(registry, sender), E_NOT_AUDITOR);
        
        let batch_len = vector::length(&record_ids);
        assert!(batch_len > 0, E_EMPTY_BATCH);
        assert!(batch_len <= 100, E_BATCH_TOO_LARGE);
        
        let records_len = vector::length(&registry.compliance_records);
        let i = 0;
        while (i < batch_len) {
            let rid = *vector::borrow(&record_ids, i);
            assert!(rid < records_len, E_RECORD_NOT_FOUND);
            i = i + 1;
        };
        
        let batch_id = registry.batch_id_counter;
        registry.batch_id_counter = batch_id + 1;
        
        let batch = AuditBatch {
            batch_id: batch_id,
            record_ids: record_ids,
            timestamp: timestamp::now_seconds(),
            submitted_by: sender,
            finalized: false,
        };
        
        vector::push_back(&mut registry.audit_batches, batch);
        
        event::emit(AuditBatchSubmitted {
            batch_id: batch_id,
            record_count: batch_len,
            submitted_by: sender,
        });
    }

    public entry fun finalize_audit_batch(
        account: &signer,
        registry_addr: address,
        batch_id: u64
    ) acquires GRCRegistry {
        let registry = borrow_global_mut<GRCRegistry>(registry_addr);
        let sender = signer::address_of(account);
        assert!(is_owner(registry, sender), E_NOT_OWNER);
        
        let batches_len = vector::length(&registry.audit_batches);
        assert!(batch_id < batches_len, E_BATCH_NOT_FOUND);
        
        let batch = vector::borrow_mut(&mut registry.audit_batches, batch_id);
        assert!(!batch.finalized, E_ALREADY_FINALIZED);
        
        let record_ids_len = vector::length(&batch.record_ids);
        let i = 0;
        while (i < record_ids_len) {
            let rid = *vector::borrow(&batch.record_ids, i);
            let record = vector::borrow(&registry.compliance_records, rid);
            assert!(record.human_approved, E_UNAPPROVED_RECORD);
            i = i + 1;
        };
        
        batch.finalized = true;
        
        event::emit(AuditBatchFinalized {
            batch_id: batch_id,
            finalized_by: sender,
            timestamp: timestamp::now_seconds(),
        });
    }

    #[view]
    public fun get_compliance_record(
        registry_addr: address,
        record_id: u64
    ): ComplianceRecord acquires GRCRegistry {
        let registry = borrow_global<GRCRegistry>(registry_addr);
        *vector::borrow(&registry.compliance_records, record_id)
    }

    #[view]
    public fun get_audit_batch(
        registry_addr: address,
        batch_id: u64
    ): AuditBatch acquires GRCRegistry {
        let registry = borrow_global<GRCRegistry>(registry_addr);
        *vector::borrow(&registry.audit_batches, batch_id)
    }

    #[view]
    public fun get_total_records(registry_addr: address): u64 acquires GRCRegistry {
        let registry = borrow_global<GRCRegistry>(registry_addr);
        registry.record_id_counter
    }

    #[view]
    public fun get_total_batches(registry_addr: address): u64 acquires GRCRegistry {
        let registry = borrow_global<GRCRegistry>(registry_addr);
        registry.batch_id_counter
    }

    #[view]
    public fun get_sector_fine_total(
        registry_addr: address,
        sector: u8
    ): u64 acquires GRCRegistry {
        let registry = borrow_global<GRCRegistry>(registry_addr);
        *vector::borrow(&registry.sector_fine_totals, (sector as u64))
    }

    #[view]
    public fun check_is_auditor(
        registry_addr: address,
        account: address
    ): bool acquires GRCRegistry {
        let registry = borrow_global<GRCRegistry>(registry_addr);
        is_auditor(registry, account)
    }
}
