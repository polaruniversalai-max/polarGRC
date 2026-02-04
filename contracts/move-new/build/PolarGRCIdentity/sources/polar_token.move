/// @title PolarToken - 2026 Institutional GRC Token
/// @notice 100M Cap, RWA Linking, and Deflationary 1% Burn
/// @dev Movement M2 Mainnet deployment
module polar_universal::polar_token {
    use std::string::{String, utf8};
    use std::signer;

    const E_INSUFFICIENT_BALANCE: u64 = 1;
    const E_NOT_OWNER: u64 = 2;
    const E_ZERO_AMOUNT: u64 = 3;

    const TOTAL_SUPPLY: u64 = 10_000_000_000_000_000;
    const BURN_RATE: u64 = 100;

    struct TokenConfig has key {
        name: String,
        symbol: String,
        decimals: u8,
        total_supply: u64,
        total_burned: u64,
        owner: address,
    }

    struct Balance has key {
        amount: u64,
    }

    struct LinkedAsset has key {
        asset_id: String,
    }

    public entry fun initialize(account: &signer) {
        let sender = signer::address_of(account);
        
        move_to(account, TokenConfig {
            name: utf8(b"PolarUniversal"),
            symbol: utf8(b"POLAR"),
            decimals: 8,
            total_supply: TOTAL_SUPPLY,
            total_burned: 0,
            owner: sender,
        });

        move_to(account, Balance {
            amount: TOTAL_SUPPLY,
        });
    }

    public entry fun transfer(
        account: &signer,
        to: address,
        amount: u64
    ) acquires TokenConfig, Balance {
        let sender = signer::address_of(account);
        
        assert!(amount > 0, E_ZERO_AMOUNT);
        
        let sender_balance = borrow_global_mut<Balance>(sender);
        assert!(sender_balance.amount >= amount, E_INSUFFICIENT_BALANCE);

        let burn_amount = amount / BURN_RATE;
        let final_amount = amount - burn_amount;

        sender_balance.amount = sender_balance.amount - amount;

        if (exists<Balance>(to)) {
            let recipient_balance = borrow_global_mut<Balance>(to);
            recipient_balance.amount = recipient_balance.amount + final_amount;
        };

        let config = borrow_global_mut<TokenConfig>(@polar_universal);
        config.total_burned = config.total_burned + burn_amount;
    }

    public entry fun link_rwa(
        account: &signer,
        asset_id: String
    ) acquires LinkedAsset {
        let sender = signer::address_of(account);
        
        if (exists<LinkedAsset>(sender)) {
            let linked = borrow_global_mut<LinkedAsset>(sender);
            linked.asset_id = asset_id;
        } else {
            move_to(account, LinkedAsset {
                asset_id,
            });
        };
    }

    #[view]
    public fun get_balance(owner: address): u64 acquires Balance {
        if (exists<Balance>(owner)) {
            borrow_global<Balance>(owner).amount
        } else {
            0
        }
    }

    #[view]
    public fun get_token_info(): (String, String, u64, u64) acquires TokenConfig {
        let config = borrow_global<TokenConfig>(@polar_universal);
        (config.name, config.symbol, config.total_supply, config.total_burned)
    }

    #[view]
    public fun get_linked_asset(owner: address): String acquires LinkedAsset {
        if (exists<LinkedAsset>(owner)) {
            borrow_global<LinkedAsset>(owner).asset_id
        } else {
            utf8(b"")
        }
    }
}
