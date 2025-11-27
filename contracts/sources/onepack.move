/// OnePack Move Smart Contract
/// Unified contract for OnePack game including tokenomics, marketplace, statistics and item management

module onepack::onepack {
    use one::object::{Self, ID, UID};
    use one::tx_context::TxContext;
    use one::transfer;
    use one::coin::{Self, Coin, TreasuryCap};
    use one::balance::{Self, Balance};
    use one::event;
    use one::table::{Self, Table};
    use one::oct::OCT;
    use std::option;

    // ========== Constants ==========
    
    /// Marketplace fee: 2.5% = 250 basis points
    const MARKETPLACE_FEE_BPS: u64 = 250;
    /// Minimum liquidity for pool
    const MIN_LIQUIDITY: u64 = 1000;
    /// Error: not authorized
    const ENotAuthorized: u64 = 0;
    /// Error: insufficient funds
    const EInsufficientFunds: u64 = 1;
    /// Error: item not found
    const EItemNotFound: u64 = 2;
    /// Error: item already listed
    const EItemAlreadyListed: u64 = 3;
    /// Error: item not listed
    const EItemNotListed: u64 = 4;
    /// Error: insufficient liquidity
    const EInsufficientLiquidity: u64 = 5;
    /// Error: pool not initialized
    const EPoolNotInitialized: u64 = 6;
    /// Error: invalid price
    const EInvalidPrice: u64 = 7;
    /// Error: stats already exists
    const EStatsAlreadyExists: u64 = 8;

    // ========== Token Types ==========
    
    /// One-Time Witness for ONEPACK token
    public struct ONEPACK has drop {}

    // ========== Structures ==========

    /// Contract administrator (stores admin address)
    public struct AdminCap has key, store {
        id: UID,
        admin: address,
    }

    /// Liquidity pool for SUI <-> ONEPACK swap (Constant Product AMM)
    public struct SwapPool has key, store {
        id: UID,
        sui_balance: Balance<OCT>,
        onepack_balance: Balance<ONEPACK>,
        k: u128, // Constant k = x * y
    }

    /// SBT token for player statistics
    public struct PlayerStats has key, store {
        id: UID,
        player: address,
        wins: u64,
        losses: u64,
        total_damage: u64,
        play_time_seconds: u64,
        level: u64,
        rating: u64,
        game_result_ipfs: vector<u8>, // IPFS URL for game results
        backpack_ipfs: vector<u8>, // IPFS URL for backpack state
    }

    /// Game item (NFT)
    public struct GameItem has key, store {
        id: UID,
        item_id: u64,
        item_type: u8,
        rarity: u8,
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        ipfs_metadata_url: vector<u8>, // IPFS URL for additional metadata
        owner: address,
        is_listed: bool, // Marketplace listing flag
    }

    /// Marketplace listing
    public struct MarketplaceListing has key, store {
        id: UID,
        item_id: ID,
        price: u64, // Price in ONEPACK tokens
        seller: address,
        created_at: u64,
    }

    /// Global contract storage
    public struct OnePackState has key, store {
        id: UID,
        admin_cap: ID,
        treasury_cap: ID,
        swap_pool: option::Option<ID>,
        items: Table<ID, GameItem>, // Storage for all items
        listings: Table<ID, MarketplaceListing>, // Active listings
        player_stats: Table<address, ID>, // Mapping of player address to their stats ID
    }

    // ========== Events ==========

    /// Item minted event
    public struct ItemMinted has copy, drop {
        item_id: ID,
        item_type: u8,
        rarity: u8,
        owner: address,
    }

    /// Item listed event
    public struct ItemListed has copy, drop {
        item_id: ID,
        price: u64,
        seller: address,
    }

    /// Item sold event
    public struct ItemSold has copy, drop {
        item_id: ID,
        price: u64,
        seller: address,
        buyer: address,
        fee: u64,
    }

    /// Item burned event
    public struct ItemBurned has copy, drop {
        item_id: ID,
    }

    /// Token minted event
    public struct TokenMinted has copy, drop {
        recipient: address,
        amount: u64,
    }

    /// Swap executed event
    public struct SwapExecuted has copy, drop {
        from_token: vector<u8>,
        to_token: vector<u8>,
        amount_in: u64,
        amount_out: u64,
        user: address,
    }

    /// Stats updated event
    public struct StatsUpdated has copy, drop {
        player: address,
        wins: u64,
        losses: u64,
        level: u64,
        rating: u64,
    }

    /// Game result recorded event
    public struct GameResultRecorded has copy, drop {
        player: address,
        ipfs_url: vector<u8>,
    }

    // ========== Initialization ==========

    /// Module initialization
    fun init(witness: ONEPACK, ctx: &mut TxContext) {
        // Create ONEPACK token
        let (treasury_cap, metadata) = coin::create_currency<ONEPACK>(
            witness,
            9, // decimals
            b"ONEPACK",
            b"OnePack Game Token",
            b"Internal game token for OnePack game",
            option::none(),
            ctx,
        );

        // Create AdminCap with deployer address
        let admin_cap = AdminCap {
            id: object::new(ctx),
            admin: ctx.sender(),
        };

        // Create global state
        let state = OnePackState {
            id: object::new(ctx),
            admin_cap: object::id(&admin_cap),
            treasury_cap: object::id(&treasury_cap),
            swap_pool: option::none(),
            items: table::new(ctx),
            listings: table::new(ctx),
            player_stats: table::new(ctx),
        };

        // Freeze token metadata
        transfer::public_freeze_object(metadata);
        
        // Transfer AdminCap and TreasuryCap to administrator
        transfer::public_transfer(admin_cap, ctx.sender());
        transfer::public_transfer(treasury_cap, ctx.sender());
        
        // Make state shared
        transfer::public_share_object(state);
    }

    // ========== Helper Functions ==========

    // Helper functions removed - permission checks are performed directly in functions

    // ========== Token Functions ==========

    /// Mint ONEPACK tokens (admin only)
    public entry fun admin_mint_tokens(
        _state: &mut OnePackState,
        admin_cap: &AdminCap,
        treasury_cap: &mut TreasuryCap<ONEPACK>,
        amount: u64,
        recipient: address,
        ctx: &mut TxContext,
    ) {
        assert!(admin_cap.admin == ctx.sender(), ENotAuthorized);
        
        let coin = coin::mint(treasury_cap, amount, ctx);
        transfer::public_transfer(coin, recipient);
        
        event::emit(TokenMinted {
            recipient,
            amount,
        });
    }

    // ========== Swap Pool Functions ==========

    /// Initialize swap pool (admin only)
    public entry fun init_swap_pool(
        state: &mut OnePackState,
        admin_cap: &AdminCap,
        treasury_cap: &mut TreasuryCap<ONEPACK>,
        initial_sui: Coin<OCT>,
        initial_onepack: u64,
        ctx: &mut TxContext,
    ) {
        assert!(admin_cap.admin == ctx.sender(), ENotAuthorized);
        assert!(option::is_none(&state.swap_pool), EPoolNotInitialized);
        let sui_amount = coin::value(&initial_sui);
        assert!(sui_amount >= MIN_LIQUIDITY && initial_onepack >= MIN_LIQUIDITY, EInsufficientLiquidity);

        let sui_balance = coin::into_balance(initial_sui);
        let onepack_balance = coin::mint_balance(treasury_cap, initial_onepack);
        
        let k = (sui_amount as u128) * (initial_onepack as u128);

        let pool = SwapPool {
            id: object::new(ctx),
            sui_balance,
            onepack_balance,
            k,
        };

        let pool_id = object::id(&pool);
        state.swap_pool = option::some(pool_id);
        transfer::public_share_object(pool);
    }

    /// Swap SUI to ONEPACK
    public entry fun swap_sui_to_onepack(
        pool: &mut SwapPool,
        sui_coin: Coin<OCT>,
        min_onepack_out: u64,
        ctx: &mut TxContext,
    ) {
        let sui_in = coin::value(&sui_coin);
        assert!(sui_in > 0, EInsufficientFunds);

        let sui_balance = balance::value(&pool.sui_balance);
        let onepack_balance = balance::value(&pool.onepack_balance);
        
        assert!(sui_balance > 0 && onepack_balance > 0, EInsufficientLiquidity);

        // Constant Product Formula: (x + dx) * (y - dy) = k
        // dy = (y * dx) / (x + dx)
        let sui_after = sui_balance + sui_in;
        let onepack_out = ((onepack_balance as u128) * (sui_in as u128) / (sui_after as u128)) as u64;
        
        assert!(onepack_out >= min_onepack_out, EInsufficientFunds);
        assert!(onepack_out < onepack_balance, EInsufficientLiquidity);

        // Update balances
        let sui_balance_in = coin::into_balance(sui_coin);
        balance::join(&mut pool.sui_balance, sui_balance_in);
        
        let onepack_out_balance = balance::split(&mut pool.onepack_balance, onepack_out);
        let onepack_coin = coin::from_balance<ONEPACK>(onepack_out_balance, ctx);
        transfer::public_transfer(onepack_coin, ctx.sender());

        event::emit(SwapExecuted {
            from_token: b"SUI",
            to_token: b"ONEPACK",
            amount_in: sui_in,
            amount_out: onepack_out,
            user: ctx.sender(),
        });
    }

    /// Swap ONEPACK to SUI
    public entry fun swap_onepack_to_sui(
        pool: &mut SwapPool,
        onepack_coin: Coin<ONEPACK>,
        min_sui_out: u64,
        ctx: &mut TxContext,
    ) {
        let onepack_in = coin::value(&onepack_coin);
        assert!(onepack_in > 0, EInsufficientFunds);

        let sui_balance = balance::value(&pool.sui_balance);
        let onepack_balance = balance::value(&pool.onepack_balance);
        
        assert!(sui_balance > 0 && onepack_balance > 0, EInsufficientLiquidity);

        // Constant Product Formula
        let onepack_after = onepack_balance + onepack_in;
        let sui_out = ((sui_balance as u128) * (onepack_in as u128) / (onepack_after as u128)) as u64;
        
        assert!(sui_out >= min_sui_out, EInsufficientFunds);
        assert!(sui_out < sui_balance, EInsufficientLiquidity);

        // Update balances
        let onepack_balance_in = coin::into_balance(onepack_coin);
        balance::join(&mut pool.onepack_balance, onepack_balance_in);
        
        let sui_out_balance = balance::split(&mut pool.sui_balance, sui_out);
        let sui_coin = coin::from_balance<OCT>(sui_out_balance, ctx);
        transfer::public_transfer(sui_coin, ctx.sender());

        event::emit(SwapExecuted {
            from_token: b"ONEPACK",
            to_token: b"SUI",
            amount_in: onepack_in,
            amount_out: sui_out,
            user: ctx.sender(),
        });
    }

    /// Add liquidity (admin only)
    public entry fun add_liquidity(
        pool: &mut SwapPool,
        admin_cap: &AdminCap,
        treasury_cap: &mut TreasuryCap<ONEPACK>,
        sui_coin: Coin<OCT>,
        onepack_amount: u64,
        ctx: &mut TxContext,
    ) {
        assert!(admin_cap.admin == ctx.sender(), ENotAuthorized);
        
        let sui_balance_in = coin::into_balance(sui_coin);
        let onepack_balance_in = coin::mint_balance(treasury_cap, onepack_amount);
        
        balance::join(&mut pool.sui_balance, sui_balance_in);
        balance::join(&mut pool.onepack_balance, onepack_balance_in);
        
        // Update k
        let sui_balance = balance::value(&pool.sui_balance);
        let onepack_balance = balance::value(&pool.onepack_balance);
        pool.k = (sui_balance as u128) * (onepack_balance as u128);
    }

    // ========== Player Statistics Functions (SBT) ==========

    /// Create player statistics (SBT)
    public entry fun create_player_stats(
        state: &mut OnePackState,
        ctx: &mut TxContext,
    ) {
        let player = ctx.sender();
        assert!(!table::contains(&state.player_stats, player), EStatsAlreadyExists);

        let stats = PlayerStats {
            id: object::new(ctx),
            player,
            wins: 0,
            losses: 0,
            total_damage: 0,
            play_time_seconds: 0,
            level: 1,
            rating: 1000,
            game_result_ipfs: vector::empty(),
            backpack_ipfs: vector::empty(),
        };

        let stats_id = object::id(&stats);
        table::add(&mut state.player_stats, player, stats_id);
        transfer::public_transfer(stats, player);
    }

    /// Update player statistics (internal function, called by contract)
    public fun update_stats(
        stats: &mut PlayerStats,
        wins_delta: u64,
        losses_delta: u64,
        damage_delta: u64,
        time_delta: u64,
    ) {
        stats.wins = stats.wins + wins_delta;
        stats.losses = stats.losses + losses_delta;
        stats.total_damage = stats.total_damage + damage_delta;
        stats.play_time_seconds = stats.play_time_seconds + time_delta;
        
        // Update level and rating (simple formula)
        let total_games = stats.wins + stats.losses;
        if (total_games > 0) {
            stats.level = 1 + (total_games / 10);
            let win_rate = (stats.wins * 100) / total_games;
            stats.rating = 1000 + (win_rate * 10) + (stats.wins * 5);
        };

        event::emit(StatsUpdated {
            player: stats.player,
            wins: stats.wins,
            losses: stats.losses,
            level: stats.level,
            rating: stats.rating,
        });
    }

    /// Update IPFS URL for game results
    public entry fun update_game_result_ipfs(
        stats: &mut PlayerStats,
        ipfs_url: vector<u8>,
        ctx: &TxContext,
    ) {
        assert!(stats.player == ctx.sender(), ENotAuthorized);
        stats.game_result_ipfs = ipfs_url;
        
        event::emit(GameResultRecorded {
            player: stats.player,
            ipfs_url,
        });
    }

    /// Update IPFS URL for backpack state
    public entry fun update_backpack_ipfs(
        stats: &mut PlayerStats,
        ipfs_url: vector<u8>,
        ctx: &TxContext,
    ) {
        assert!(stats.player == ctx.sender(), ENotAuthorized);
        stats.backpack_ipfs = ipfs_url;
    }

    // ========== Game Item Functions ==========

    /// Create new item (admin only)
    /// Item is created and transferred to owner directly
    public entry fun admin_mint_item(
        _state: &mut OnePackState,
        admin_cap: &AdminCap,
        item_id: u64,
        item_type: u8,
        rarity: u8,
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        ipfs_metadata_url: vector<u8>,
        owner: address,
        ctx: &mut TxContext,
    ) {
        assert!(admin_cap.admin == ctx.sender(), ENotAuthorized);

        let item = GameItem {
            id: object::new(ctx),
            item_id,
            item_type,
            rarity,
            name,
            description,
            image_url,
            ipfs_metadata_url,
            owner,
            is_listed: false,
        };

        let item_id_obj = object::id(&item);
        // Item is transferred to owner, added to Table only when listed for sale
        transfer::public_transfer(item, owner);

        event::emit(ItemMinted {
            item_id: item_id_obj,
            item_type,
            rarity,
            owner,
        });
    }

    /// Edit item (admin only)
    public entry fun admin_edit_item(
        state: &mut OnePackState,
        admin_cap: &AdminCap,
        item_id: ID,
        new_name: vector<u8>,
        new_description: vector<u8>,
        new_image_url: vector<u8>,
        new_ipfs_metadata_url: vector<u8>,
        ctx: &TxContext,
    ) {
        assert!(admin_cap.admin == ctx.sender(), ENotAuthorized);
        assert!(table::contains(&state.items, item_id), EItemNotFound);

        let item = table::borrow_mut(&mut state.items, item_id);
        item.name = new_name;
        item.description = new_description;
        item.image_url = new_image_url;
        item.ipfs_metadata_url = new_ipfs_metadata_url;
    }

    /// Delete item (admin only)
    public entry fun admin_delete_item(
        state: &mut OnePackState,
        admin_cap: &AdminCap,
        item_id: ID,
        ctx: &TxContext,
    ) {
        assert!(admin_cap.admin == ctx.sender(), ENotAuthorized);
        assert!(table::contains(&state.items, item_id), EItemNotFound);
        
        // Check if item is listed for sale
        if (table::contains(&state.listings, item_id)) {
            let listing = table::remove(&mut state.listings, item_id);
            let MarketplaceListing { id, item_id: _, price: _, seller: _, created_at: _ } = listing;
            object::delete(id);
        };

        let item = table::remove(&mut state.items, item_id);
        let GameItem { id, item_id: _, item_type: _, rarity: _, name: _, description: _, image_url: _, ipfs_metadata_url: _, owner: _, is_listed: _ } = item;
        object::delete(id);

        event::emit(ItemBurned {
            item_id,
        });
    }

    /// Add item to player (admin only)
    /// If item is in Table (on marketplace), it will be removed and transferred to player
    public entry fun admin_add_item_to_player(
        state: &mut OnePackState,
        admin_cap: &AdminCap,
        item_id: ID,
        player: address,
        ctx: &mut TxContext,
    ) {
        assert!(admin_cap.admin == ctx.sender(), ENotAuthorized);
        
        // If item is in Table (on marketplace), remove it
        if (table::contains(&state.items, item_id)) {
            // Check if item is listed for sale
            if (table::contains(&state.listings, item_id)) {
                let listing = table::remove(&mut state.listings, item_id);
                let MarketplaceListing { id, item_id: _, price: _, seller: _, created_at: _ } = listing;
                object::delete(id);
            };

            // Remove item from Table and transfer to player
            let mut item = table::remove(&mut state.items, item_id);
            item.owner = player;
            item.is_listed = false;
            transfer::public_transfer(item, player);
        } else {
            // Item is not in Table, meaning it's owned by someone
            // In this case admin cannot transfer it without access to the object
            // This function only works for items in Table
            abort EItemNotFound
        };
    }

    /// Remove item from player (admin only)
    public entry fun admin_remove_item_from_player(
        state: &mut OnePackState,
        admin_cap: &AdminCap,
        item_id: ID,
        ctx: &TxContext,
    ) {
        assert!(admin_cap.admin == ctx.sender(), ENotAuthorized);
        assert!(table::contains(&state.items, item_id), EItemNotFound);

        // Remove from listings if exists
        if (table::contains(&state.listings, item_id)) {
            let listing = table::remove(&mut state.listings, item_id);
            let MarketplaceListing { id, item_id: _, price: _, seller: _, created_at: _ } = listing;
            object::delete(id);
        };

        let item = table::remove(&mut state.items, item_id);
        let GameItem { id, item_id: _, item_type: _, rarity: _, name: _, description: _, image_url: _, ipfs_metadata_url: _, owner: _, is_listed: _ } = item;
        object::delete(id);

        event::emit(ItemBurned {
            item_id,
        });
    }

    // ========== Marketplace Functions ==========

    /// List item for sale
    /// Item is transferred to contract and added to Table
    public entry fun list_item(
        state: &mut OnePackState,
        item: GameItem,
        price: u64,
        ctx: &mut TxContext,
    ) {
        let item_id = object::id(&item);
        assert!(item.owner == ctx.sender(), ENotAuthorized);
        assert!(!item.is_listed, EItemAlreadyListed);
        assert!(!table::contains(&state.listings, item_id), EItemAlreadyListed);
        assert!(price > 0, EInvalidPrice);

        let seller = item.owner;
        let mut item_mut = item;
        item_mut.is_listed = true;

        // Add item to Table
        table::add(&mut state.items, item_id, item_mut);

        let listing = MarketplaceListing {
            id: object::new(ctx),
            item_id,
            price,
            seller,
            created_at: 0, // TODO: use clock::timestamp_ms() if timestamp is needed
        };

        table::add(&mut state.listings, item_id, listing);

        event::emit(ItemListed {
            item_id,
            price,
            seller,
        });
    }

    /// Cancel listing
    /// Item is returned to owner
    public entry fun cancel_listing(
        state: &mut OnePackState,
        item_id: ID,
        ctx: &mut TxContext,
    ) {
        assert!(table::contains(&state.items, item_id), EItemNotFound);
        assert!(table::contains(&state.listings, item_id), EItemNotListed);

        // Get item information
        let item = table::borrow(&state.items, item_id);
        assert!(item.owner == ctx.sender(), ENotAuthorized);
        assert!(item.is_listed, EItemNotListed);
        
        let owner = item.owner;
        
        // Remove listing
        let listing = table::remove(&mut state.listings, item_id);
        let MarketplaceListing { id, item_id: _, price: _, seller: _, created_at: _ } = listing;
        object::delete(id);
        
        // Remove item from Table and return to owner
        let mut item_obj = table::remove(&mut state.items, item_id);
        item_obj.is_listed = false;
        transfer::public_transfer(item_obj, owner);
    }

    /// Buy item on marketplace
    public entry fun buy_item(
        state: &mut OnePackState,
        treasury_cap: &mut TreasuryCap<ONEPACK>,
        item_id: ID,
        mut payment: Coin<ONEPACK>,
        ctx: &mut TxContext,
    ) {
        assert!(table::contains(&state.listings, item_id), EItemNotListed);
        assert!(table::contains(&state.items, item_id), EItemNotFound);
        
        let listing = table::borrow(&state.listings, item_id);
        let price = listing.price;
        let seller = listing.seller;
        assert!(coin::value(&payment) >= price, EInsufficientFunds);
        assert!(ctx.sender() != seller, ENotAuthorized);

        // Calculate fee (2.5%)
        let fee = (price * MARKETPLACE_FEE_BPS) / 10000;
        let seller_amount = price - fee;

        // Transfer tokens to seller
        if (seller_amount > 0) {
            let seller_coin = coin::split(&mut payment, seller_amount, ctx);
            transfer::public_transfer(seller_coin, seller);
        };

        // Burn fee (remaining payment should equal fee)
        coin::burn(treasury_cap, payment);

        // Remove listing
        let listing = table::remove(&mut state.listings, item_id);
        let MarketplaceListing { id: listing_id, item_id: _, price: _, seller: _, created_at: _ } = listing;
        object::delete(listing_id);
        
        // Remove item from Table and transfer to buyer
        let mut item = table::remove(&mut state.items, item_id);
        item.owner = ctx.sender();
        item.is_listed = false;
        transfer::public_transfer(item, ctx.sender());

        event::emit(ItemSold {
            item_id,
            price,
            seller,
            buyer: ctx.sender(),
            fee,
        });
    }

    // ========== Getters ==========

    /// Get player statistics
    public fun get_stats(stats: &PlayerStats): (u64, u64, u64, u64, u64, u64) {
        (stats.wins, stats.losses, stats.total_damage, stats.play_time_seconds, stats.level, stats.rating)
    }

    /// Get item information
    public fun get_item_info(item: &GameItem): (u64, u8, u8, address, bool) {
        (item.item_id, item.item_type, item.rarity, item.owner, item.is_listed)
    }

    /// Get listing information
    public fun get_listing_info(listing: &MarketplaceListing): (ID, u64, address, u64) {
        (listing.item_id, listing.price, listing.seller, listing.created_at)
    }

    /// Get pool balances
    public fun get_pool_balances(pool: &SwapPool): (u64, u64) {
        (balance::value(&pool.sui_balance), balance::value(&pool.onepack_balance))
    }
}
