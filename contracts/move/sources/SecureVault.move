/// @title SecureVault - PolarUniversal Treasury Management
/// @notice Multi-sig treasury vault for Movement Network
/// @dev Vault Admin: 0x8b31510c61d4f6f04abb100093eb9a79f2edd0fe6df15424eab4ed0721872c43
/// @dev Deployed on: Movement Testnet (Porto)
module polar_universal::secure_vault {
    use std::string::{String, utf8};
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin::AptosCoin;

    const VAULT_ADMIN: address = @0x8b31510c61d4f6f04abb100093eb9a79f2edd0fe6df15424eab4ed0721872c43;
    
    const E_NOT_OWNER: u64 = 1;
    const E_NOT_AUTHORIZED: u64 = 2;
    const E_INSUFFICIENT_BALANCE: u64 = 3;
    const E_VAULT_LOCKED: u64 = 4;
    const E_INVALID_AMOUNT: u64 = 5;
    const E_COOLDOWN_ACTIVE: u64 = 6;
    const E_THRESHOLD_NOT_MET: u64 = 7;
    const E_ALREADY_SIGNED: u64 = 8;
    const E_PROPOSAL_NOT_FOUND: u64 = 9;
    const E_PROPOSAL_EXECUTED: u64 = 10;

    const WITHDRAWAL_COOLDOWN: u64 = 86400;
    const LARGE_WITHDRAWAL_THRESHOLD: u64 = 100_000_000000;
    const REQUIRED_SIGNATURES: u64 = 2;

    struct VaultConfig has key {
        owner: address,
        treasury_address: address,
        authorized_signers: vector<address>,
        is_locked: bool,
        total_deposited: u64,
        total_withdrawn: u64,
        created_at: u64,
        last_activity: u64,
    }

    struct VaultBalance has key {
        balance: u64,
        locked_balance: u64,
        pending_withdrawals: u64,
    }

    struct WithdrawalProposal has store, copy, drop {
        id: u64,
        proposer: address,
        recipient: address,
        amount: u64,
        signatures: vector<address>,
        created_at: u64,
        executed: bool,
        description: String,
    }

    struct ProposalRegistry has key {
        proposals: vector<WithdrawalProposal>,
        proposal_counter: u64,
    }

    struct StakingPosition has store, copy, drop {
        depositor: address,
        amount: u64,
        staked_at: u64,
        unlock_time: u64,
        rewards_earned: u64,
        is_active: bool,
    }

    struct StakingRegistry has key {
        positions: vector<StakingPosition>,
        total_staked: u64,
        reward_rate: u64,
    }

    struct AuditRecord has store, copy, drop {
        id: u64,
        action: String,
        actor: address,
        amount: u64,
        timestamp: u64,
        tx_hash: vector<u8>,
    }

    struct AuditLog has key {
        records: vector<AuditRecord>,
        record_counter: u64,
    }

    #[event]
    struct VaultInitialized has drop, store {
        owner: address,
        treasury: address,
        timestamp: u64,
    }

    #[event]
    struct DepositReceived has drop, store {
        depositor: address,
        amount: u64,
        new_balance: u64,
        timestamp: u64,
    }

    #[event]
    struct WithdrawalProposed has drop, store {
        proposal_id: u64,
        proposer: address,
        recipient: address,
        amount: u64,
    }

    #[event]
    struct WithdrawalSigned has drop, store {
        proposal_id: u64,
        signer: address,
        signatures_count: u64,
    }

    #[event]
    struct WithdrawalExecuted has drop, store {
        proposal_id: u64,
        recipient: address,
        amount: u64,
        timestamp: u64,
    }

    #[event]
    struct StakeCreated has drop, store {
        depositor: address,
        amount: u64,
        unlock_time: u64,
    }

    #[event]
    struct StakeWithdrawn has drop, store {
        depositor: address,
        amount: u64,
        rewards: u64,
    }

    #[event]
    struct VaultLocked has drop, store {
        locked_by: address,
        timestamp: u64,
    }

    #[event]
    struct VaultUnlocked has drop, store {
        unlocked_by: address,
        timestamp: u64,
    }

    public entry fun initialize(
        account: &signer,
        treasury_address: address
    ) {
        let owner_addr = signer::address_of(account);
        let signers = vector::empty<address>();
        vector::push_back(&mut signers, owner_addr);

        move_to(account, VaultConfig {
            owner: owner_addr,
            treasury_address: treasury_address,
            authorized_signers: signers,
            is_locked: false,
            total_deposited: 0,
            total_withdrawn: 0,
            created_at: timestamp::now_seconds(),
            last_activity: timestamp::now_seconds(),
        });

        move_to(account, VaultBalance {
            balance: 0,
            locked_balance: 0,
            pending_withdrawals: 0,
        });

        move_to(account, ProposalRegistry {
            proposals: vector::empty<WithdrawalProposal>(),
            proposal_counter: 0,
        });

        move_to(account, StakingRegistry {
            positions: vector::empty<StakingPosition>(),
            total_staked: 0,
            reward_rate: 500,
        });

        move_to(account, AuditLog {
            records: vector::empty<AuditRecord>(),
            record_counter: 0,
        });

        event::emit(VaultInitialized {
            owner: owner_addr,
            treasury: treasury_address,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun add_signer(
        account: &signer,
        vault_addr: address,
        new_signer: address
    ) acquires VaultConfig {
        let config = borrow_global_mut<VaultConfig>(vault_addr);
        let sender = signer::address_of(account);
        assert!(config.owner == sender, E_NOT_OWNER);
        
        if (!vector::contains(&config.authorized_signers, &new_signer)) {
            vector::push_back(&mut config.authorized_signers, new_signer);
        };
    }

    public entry fun remove_signer(
        account: &signer,
        vault_addr: address,
        signer_to_remove: address
    ) acquires VaultConfig {
        let config = borrow_global_mut<VaultConfig>(vault_addr);
        let sender = signer::address_of(account);
        assert!(config.owner == sender, E_NOT_OWNER);
        
        let (found, index) = vector::index_of(&config.authorized_signers, &signer_to_remove);
        if (found && signer_to_remove != config.owner) {
            vector::remove(&mut config.authorized_signers, index);
        };
    }

    public entry fun deposit(
        account: &signer,
        vault_addr: address,
        amount: u64
    ) acquires VaultConfig, VaultBalance, AuditLog {
        let config = borrow_global_mut<VaultConfig>(vault_addr);
        assert!(!config.is_locked, E_VAULT_LOCKED);
        assert!(amount > 0, E_INVALID_AMOUNT);

        let sender = signer::address_of(account);
        
        let balance = borrow_global_mut<VaultBalance>(vault_addr);
        balance.balance = balance.balance + amount;
        config.total_deposited = config.total_deposited + amount;
        config.last_activity = timestamp::now_seconds();

        let audit_log = borrow_global_mut<AuditLog>(vault_addr);
        let record_id = audit_log.record_counter;
        audit_log.record_counter = record_id + 1;
        
        vector::push_back(&mut audit_log.records, AuditRecord {
            id: record_id,
            action: utf8(b"DEPOSIT"),
            actor: sender,
            amount: amount,
            timestamp: timestamp::now_seconds(),
            tx_hash: vector::empty<u8>(),
        });

        event::emit(DepositReceived {
            depositor: sender,
            amount: amount,
            new_balance: balance.balance,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun propose_withdrawal(
        account: &signer,
        vault_addr: address,
        recipient: address,
        amount: u64,
        description: String
    ) acquires VaultConfig, VaultBalance, ProposalRegistry {
        let config = borrow_global<VaultConfig>(vault_addr);
        let sender = signer::address_of(account);
        assert!(vector::contains(&config.authorized_signers, &sender), E_NOT_AUTHORIZED);
        assert!(!config.is_locked, E_VAULT_LOCKED);

        let balance = borrow_global<VaultBalance>(vault_addr);
        assert!(balance.balance >= amount, E_INSUFFICIENT_BALANCE);

        let registry = borrow_global_mut<ProposalRegistry>(vault_addr);
        let proposal_id = registry.proposal_counter;
        registry.proposal_counter = proposal_id + 1;

        let signatures = vector::empty<address>();
        vector::push_back(&mut signatures, sender);

        vector::push_back(&mut registry.proposals, WithdrawalProposal {
            id: proposal_id,
            proposer: sender,
            recipient: recipient,
            amount: amount,
            signatures: signatures,
            created_at: timestamp::now_seconds(),
            executed: false,
            description: description,
        });

        event::emit(WithdrawalProposed {
            proposal_id: proposal_id,
            proposer: sender,
            recipient: recipient,
            amount: amount,
        });
    }

    public entry fun sign_proposal(
        account: &signer,
        vault_addr: address,
        proposal_id: u64
    ) acquires VaultConfig, ProposalRegistry {
        let config = borrow_global<VaultConfig>(vault_addr);
        let sender = signer::address_of(account);
        assert!(vector::contains(&config.authorized_signers, &sender), E_NOT_AUTHORIZED);

        let registry = borrow_global_mut<ProposalRegistry>(vault_addr);
        let proposals_len = vector::length(&registry.proposals);
        assert!(proposal_id < proposals_len, E_PROPOSAL_NOT_FOUND);

        let proposal = vector::borrow_mut(&mut registry.proposals, proposal_id);
        assert!(!proposal.executed, E_PROPOSAL_EXECUTED);
        assert!(!vector::contains(&proposal.signatures, &sender), E_ALREADY_SIGNED);

        vector::push_back(&mut proposal.signatures, sender);

        event::emit(WithdrawalSigned {
            proposal_id: proposal_id,
            signer: sender,
            signatures_count: vector::length(&proposal.signatures),
        });
    }

    public entry fun execute_proposal(
        account: &signer,
        vault_addr: address,
        proposal_id: u64
    ) acquires VaultConfig, VaultBalance, ProposalRegistry, AuditLog {
        let config = borrow_global_mut<VaultConfig>(vault_addr);
        let sender = signer::address_of(account);
        assert!(vector::contains(&config.authorized_signers, &sender), E_NOT_AUTHORIZED);
        assert!(!config.is_locked, E_VAULT_LOCKED);

        let registry = borrow_global_mut<ProposalRegistry>(vault_addr);
        let proposals_len = vector::length(&registry.proposals);
        assert!(proposal_id < proposals_len, E_PROPOSAL_NOT_FOUND);

        let proposal = vector::borrow_mut(&mut registry.proposals, proposal_id);
        assert!(!proposal.executed, E_PROPOSAL_EXECUTED);

        let sig_count = vector::length(&proposal.signatures);
        if (proposal.amount >= LARGE_WITHDRAWAL_THRESHOLD) {
            assert!(sig_count >= REQUIRED_SIGNATURES, E_THRESHOLD_NOT_MET);
        };

        let balance = borrow_global_mut<VaultBalance>(vault_addr);
        assert!(balance.balance >= proposal.amount, E_INSUFFICIENT_BALANCE);

        balance.balance = balance.balance - proposal.amount;
        config.total_withdrawn = config.total_withdrawn + proposal.amount;
        config.last_activity = timestamp::now_seconds();
        proposal.executed = true;

        let audit_log = borrow_global_mut<AuditLog>(vault_addr);
        let record_id = audit_log.record_counter;
        audit_log.record_counter = record_id + 1;
        
        vector::push_back(&mut audit_log.records, AuditRecord {
            id: record_id,
            action: utf8(b"WITHDRAWAL_EXECUTED"),
            actor: sender,
            amount: proposal.amount,
            timestamp: timestamp::now_seconds(),
            tx_hash: vector::empty<u8>(),
        });

        event::emit(WithdrawalExecuted {
            proposal_id: proposal_id,
            recipient: proposal.recipient,
            amount: proposal.amount,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun stake(
        account: &signer,
        vault_addr: address,
        amount: u64,
        lock_duration: u64
    ) acquires VaultConfig, StakingRegistry {
        let config = borrow_global<VaultConfig>(vault_addr);
        assert!(!config.is_locked, E_VAULT_LOCKED);
        assert!(amount > 0, E_INVALID_AMOUNT);

        let sender = signer::address_of(account);
        let registry = borrow_global_mut<StakingRegistry>(vault_addr);
        
        let unlock_time = timestamp::now_seconds() + lock_duration;
        
        vector::push_back(&mut registry.positions, StakingPosition {
            depositor: sender,
            amount: amount,
            staked_at: timestamp::now_seconds(),
            unlock_time: unlock_time,
            rewards_earned: 0,
            is_active: true,
        });

        registry.total_staked = registry.total_staked + amount;

        event::emit(StakeCreated {
            depositor: sender,
            amount: amount,
            unlock_time: unlock_time,
        });
    }

    public entry fun lock_vault(
        account: &signer,
        vault_addr: address
    ) acquires VaultConfig {
        let config = borrow_global_mut<VaultConfig>(vault_addr);
        let sender = signer::address_of(account);
        assert!(config.owner == sender, E_NOT_OWNER);
        
        config.is_locked = true;

        event::emit(VaultLocked {
            locked_by: sender,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun unlock_vault(
        account: &signer,
        vault_addr: address
    ) acquires VaultConfig {
        let config = borrow_global_mut<VaultConfig>(vault_addr);
        let sender = signer::address_of(account);
        assert!(config.owner == sender, E_NOT_OWNER);
        
        config.is_locked = false;

        event::emit(VaultUnlocked {
            unlocked_by: sender,
            timestamp: timestamp::now_seconds(),
        });
    }

    #[view]
    public fun get_vault_balance(vault_addr: address): u64 acquires VaultBalance {
        let balance = borrow_global<VaultBalance>(vault_addr);
        balance.balance
    }

    #[view]
    public fun get_vault_stats(vault_addr: address): (u64, u64, bool, u64) acquires VaultConfig {
        let config = borrow_global<VaultConfig>(vault_addr);
        (config.total_deposited, config.total_withdrawn, config.is_locked, config.last_activity)
    }

    #[view]
    public fun get_total_staked(vault_addr: address): u64 acquires StakingRegistry {
        let registry = borrow_global<StakingRegistry>(vault_addr);
        registry.total_staked
    }

    #[view]
    public fun is_signer(vault_addr: address, account: address): bool acquires VaultConfig {
        let config = borrow_global<VaultConfig>(vault_addr);
        vector::contains(&config.authorized_signers, &account)
    }

    #[view]
    public fun get_proposal_count(vault_addr: address): u64 acquires ProposalRegistry {
        let registry = borrow_global<ProposalRegistry>(vault_addr);
        registry.proposal_counter
    }
}
