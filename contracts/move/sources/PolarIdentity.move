/// @title PolarIdentity - 2026 Institutional GRC Identity Hub
/// @notice Handles KYC, AI Agents, and GRC compliance verification
/// @dev Movement M2 Mainnet deployment
module polar_universal::polar_identity {
    use std::string::String;
    use std::signer;
    use std::vector;
    use aptos_framework::timestamp;
    use aptos_framework::event;

    const E_NOT_CEO: u64 = 1;
    const E_ALREADY_REGISTERED: u64 = 2;
    const E_NOT_REGISTERED: u64 = 3;

    struct IdentityConfig has key {
        ceo: address,
        token_address: address,
        total_registered: u64,
        created_at: u64,
    }

    struct Profile has store, copy, drop {
        name: String,
        jurisdiction: String,
        kyc_verified: bool,
        is_ai_agent: bool,
        registered_at: u64,
    }

    struct ProfileRegistry has key {
        profiles: vector<ProfileEntry>,
    }

    struct ProfileEntry has store, copy, drop {
        user: address,
        profile: Profile,
    }

    #[event]
    struct ProfileRegistered has drop, store {
        user: address,
        name: String,
        jurisdiction: String,
        is_ai_agent: bool,
        timestamp: u64,
    }

    #[event]
    struct ComplianceVerified has drop, store {
        user: address,
        verified_by: address,
        timestamp: u64,
    }

    #[event]
    struct TokenLinked has drop, store {
        token_address: address,
        linked_by: address,
        timestamp: u64,
    }

    public entry fun initialize(account: &signer) {
        let sender = signer::address_of(account);
        
        move_to(account, IdentityConfig {
            ceo: sender,
            token_address: @0x0,
            total_registered: 0,
            created_at: timestamp::now_seconds(),
        });

        move_to(account, ProfileRegistry {
            profiles: vector::empty(),
        });
    }

    public entry fun register(
        account: &signer,
        name: String,
        jurisdiction: String,
        is_agent: bool
    ) acquires IdentityConfig, ProfileRegistry {
        let sender = signer::address_of(account);
        let config = borrow_global_mut<IdentityConfig>(@polar_universal);
        let registry = borrow_global_mut<ProfileRegistry>(@polar_universal);

        let profile = Profile {
            name,
            jurisdiction,
            kyc_verified: false,
            is_ai_agent: is_agent,
            registered_at: timestamp::now_seconds(),
        };

        let entry = ProfileEntry {
            user: sender,
            profile,
        };

        vector::push_back(&mut registry.profiles, entry);
        config.total_registered = config.total_registered + 1;

        event::emit(ProfileRegistered {
            user: sender,
            name,
            jurisdiction,
            is_ai_agent: is_agent,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun verify_compliance(
        account: &signer,
        user: address
    ) acquires IdentityConfig, ProfileRegistry {
        let sender = signer::address_of(account);
        let config = borrow_global<IdentityConfig>(@polar_universal);
        
        assert!(sender == config.ceo, E_NOT_CEO);

        let registry = borrow_global_mut<ProfileRegistry>(@polar_universal);
        let i = 0;
        let len = vector::length(&registry.profiles);
        
        while (i < len) {
            let entry = vector::borrow_mut(&mut registry.profiles, i);
            if (entry.user == user) {
                entry.profile.kyc_verified = true;
                break
            };
            i = i + 1;
        };

        event::emit(ComplianceVerified {
            user,
            verified_by: sender,
            timestamp: timestamp::now_seconds(),
        });
    }

    public entry fun set_token_address(
        account: &signer,
        token_address: address
    ) acquires IdentityConfig {
        let sender = signer::address_of(account);
        let config = borrow_global_mut<IdentityConfig>(@polar_universal);
        
        assert!(sender == config.ceo, E_NOT_CEO);
        config.token_address = token_address;

        event::emit(TokenLinked {
            token_address,
            linked_by: sender,
            timestamp: timestamp::now_seconds(),
        });
    }

    #[view]
    public fun get_config(): (address, address, u64) acquires IdentityConfig {
        let config = borrow_global<IdentityConfig>(@polar_universal);
        (config.ceo, config.token_address, config.total_registered)
    }

    #[view]
    public fun is_kyc_verified(user: address): bool acquires ProfileRegistry {
        let registry = borrow_global<ProfileRegistry>(@polar_universal);
        let i = 0;
        let len = vector::length(&registry.profiles);
        
        while (i < len) {
            let entry = vector::borrow(&registry.profiles, i);
            if (entry.user == user) {
                return entry.profile.kyc_verified
            };
            i = i + 1;
        };
        false
    }
}
