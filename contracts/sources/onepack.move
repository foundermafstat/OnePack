/// OnePack Move Smart Contract
/// Единый контракт для игры OnePack включающий токеномику, маркетплейс, статистику и управление предметами

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

    // ========== Константы ==========
    
    /// Комиссия маркетплейса: 2.5% = 250 базисных пунктов
    const MARKETPLACE_FEE_BPS: u64 = 250;
    /// Минимальная ликвидность для пула
    const MIN_LIQUIDITY: u64 = 1000;
    /// Ошибка: не авторизован
    const ENotAuthorized: u64 = 0;
    /// Ошибка: недостаточно средств
    const EInsufficientFunds: u64 = 1;
    /// Ошибка: предмет не найден
    const EItemNotFound: u64 = 2;
    /// Ошибка: предмет уже в продаже
    const EItemAlreadyListed: u64 = 3;
    /// Ошибка: предмет не в продаже
    const EItemNotListed: u64 = 4;
    /// Ошибка: недостаточная ликвидность
    const EInsufficientLiquidity: u64 = 5;
    /// Ошибка: пул не инициализирован
    const EPoolNotInitialized: u64 = 6;
    /// Ошибка: неверная цена
    const EInvalidPrice: u64 = 7;
    /// Ошибка: статистика уже существует
    const EStatsAlreadyExists: u64 = 8;

    // ========== Типы токенов ==========
    
    /// One-Time Witness для токена ONEPACK
    public struct ONEPACK has drop {}

    // ========== Структуры ==========

    /// Администратор контракта (хранит адрес админа)
    public struct AdminCap has key, store {
        id: UID,
        admin: address,
    }

    /// Пул ликвидности для свапа SUI <-> ONEPACK (Constant Product AMM)
    public struct SwapPool has key, store {
        id: UID,
        sui_balance: Balance<OCT>,
        onepack_balance: Balance<ONEPACK>,
        k: u128, // Константа k = x * y
    }

    /// SBT токен для статистики игрока
    public struct PlayerStats has key, store {
        id: UID,
        player: address,
        wins: u64,
        losses: u64,
        total_damage: u64,
        play_time_seconds: u64,
        level: u64,
        rating: u64,
        game_result_ipfs: vector<u8>, // IPFS URL для результатов игр
        backpack_ipfs: vector<u8>, // IPFS URL для состояния рюкзака
    }

    /// Игровой предмет (NFT)
    public struct GameItem has key, store {
        id: UID,
        item_id: u64,
        item_type: u8,
        rarity: u8,
        name: vector<u8>,
        description: vector<u8>,
        image_url: vector<u8>,
        ipfs_metadata_url: vector<u8>, // IPFS URL для дополнительных метаданных
        owner: address,
        is_listed: bool, // Флаг продажи на маркетплейсе
    }

    /// Листинг на маркетплейсе
    public struct MarketplaceListing has key, store {
        id: UID,
        item_id: ID,
        price: u64, // Цена в ONEPACK токенах
        seller: address,
        created_at: u64,
    }

    /// Глобальное хранилище контракта
    public struct OnePackState has key, store {
        id: UID,
        admin_cap: ID,
        treasury_cap: ID,
        swap_pool: option::Option<ID>,
        items: Table<ID, GameItem>, // Хранилище всех предметов
        listings: Table<ID, MarketplaceListing>, // Активные листинги
        player_stats: Table<address, ID>, // Маппинг адреса игрока на ID его статистики
    }

    // ========== События ==========

    /// Событие создания предмета
    public struct ItemMinted has copy, drop {
        item_id: ID,
        item_type: u8,
        rarity: u8,
        owner: address,
    }

    /// Событие выставления предмета на продажу
    public struct ItemListed has copy, drop {
        item_id: ID,
        price: u64,
        seller: address,
    }

    /// Событие продажи предмета
    public struct ItemSold has copy, drop {
        item_id: ID,
        price: u64,
        seller: address,
        buyer: address,
        fee: u64,
    }

    /// Событие сжигания предмета
    public struct ItemBurned has copy, drop {
        item_id: ID,
    }

    /// Событие минтинга токенов
    public struct TokenMinted has copy, drop {
        recipient: address,
        amount: u64,
    }

    /// Событие свапа
    public struct SwapExecuted has copy, drop {
        from_token: vector<u8>,
        to_token: vector<u8>,
        amount_in: u64,
        amount_out: u64,
        user: address,
    }

    /// Событие обновления статистики
    public struct StatsUpdated has copy, drop {
        player: address,
        wins: u64,
        losses: u64,
        level: u64,
        rating: u64,
    }

    /// Событие записи результата игры
    public struct GameResultRecorded has copy, drop {
        player: address,
        ipfs_url: vector<u8>,
    }

    // ========== Инициализация ==========

    /// Инициализация модуля
    fun init(witness: ONEPACK, ctx: &mut TxContext) {
        // Создание токена ONEPACK
        let (treasury_cap, metadata) = coin::create_currency<ONEPACK>(
            witness,
            9, // decimals
            b"ONEPACK",
            b"OnePack Game Token",
            b"Internal game token for OnePack game",
            option::none(),
            ctx,
        );

        // Создание AdminCap с адресом деплоя
        let admin_cap = AdminCap {
            id: object::new(ctx),
            admin: ctx.sender(),
        };

        // Создание глобального состояния
        let state = OnePackState {
            id: object::new(ctx),
            admin_cap: object::id(&admin_cap),
            treasury_cap: object::id(&treasury_cap),
            swap_pool: option::none(),
            items: table::new(ctx),
            listings: table::new(ctx),
            player_stats: table::new(ctx),
        };

        // Замораживаем метаданные токена
        transfer::public_freeze_object(metadata);
        
        // Передаем AdminCap и TreasuryCap администратору
        transfer::public_transfer(admin_cap, ctx.sender());
        transfer::public_transfer(treasury_cap, ctx.sender());
        
        // Делаем состояние общим (shared)
        transfer::public_share_object(state);
    }

    // ========== Вспомогательные функции ==========

    // Вспомогательные функции удалены - проверка прав выполняется напрямую в функциях

    // ========== Функции токена ==========

    /// Минтинг ONEPACK токенов (только админ)
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

    // ========== Функции свап пула ==========

    /// Инициализация свап пула (только админ)
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

    /// Свап SUI на ONEPACK
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

        // Обновляем балансы
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

    /// Свап ONEPACK на SUI
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

        // Обновляем балансы
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

    /// Добавление ликвидности (только админ)
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
        
        // Обновляем k
        let sui_balance = balance::value(&pool.sui_balance);
        let onepack_balance = balance::value(&pool.onepack_balance);
        pool.k = (sui_balance as u128) * (onepack_balance as u128);
    }

    // ========== Функции статистики игрока (SBT) ==========

    /// Создание статистики игрока (SBT)
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

    /// Обновление статистики игрока (внутренняя функция, вызывается контрактом)
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
        
        // Обновление уровня и рейтинга (простая формула)
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

    /// Обновление IPFS URL для результатов игры
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

    /// Обновление IPFS URL для состояния рюкзака
    public entry fun update_backpack_ipfs(
        stats: &mut PlayerStats,
        ipfs_url: vector<u8>,
        ctx: &TxContext,
    ) {
        assert!(stats.player == ctx.sender(), ENotAuthorized);
        stats.backpack_ipfs = ipfs_url;
    }

    // ========== Функции игровых предметов ==========

    /// Создание нового предмета (только админ)
    /// Предмет создается и передается владельцу напрямую
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
        // Предмет передается владельцу, в Table добавляется только при выставлении на продажу
        transfer::public_transfer(item, owner);

        event::emit(ItemMinted {
            item_id: item_id_obj,
            item_type,
            rarity,
            owner,
        });
    }

    /// Редактирование предмета (только админ)
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

    /// Удаление предмета (только админ)
    public entry fun admin_delete_item(
        state: &mut OnePackState,
        admin_cap: &AdminCap,
        item_id: ID,
        ctx: &TxContext,
    ) {
        assert!(admin_cap.admin == ctx.sender(), ENotAuthorized);
        assert!(table::contains(&state.items, item_id), EItemNotFound);
        
        // Проверяем, не в продаже ли предмет
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

    /// Добавление предмета игроку (только админ)
    /// Если предмет в Table (на маркетплейсе), он будет удален и передан игроку
    public entry fun admin_add_item_to_player(
        state: &mut OnePackState,
        admin_cap: &AdminCap,
        item_id: ID,
        player: address,
        ctx: &mut TxContext,
    ) {
        assert!(admin_cap.admin == ctx.sender(), ENotAuthorized);
        
        // Если предмет в Table (на маркетплейсе), удаляем его
        if (table::contains(&state.items, item_id)) {
            // Проверяем, не в продаже ли предмет
            if (table::contains(&state.listings, item_id)) {
                let listing = table::remove(&mut state.listings, item_id);
                let MarketplaceListing { id, item_id: _, price: _, seller: _, created_at: _ } = listing;
                object::delete(id);
            };

            // Удаляем предмет из Table и передаем игроку
            let mut item = table::remove(&mut state.items, item_id);
            item.owner = player;
            item.is_listed = false;
            transfer::public_transfer(item, player);
        } else {
            // Предмет не в Table, значит он у кого-то во владении
            // В этом случае админ не может его передать без доступа к объекту
            // Эта функция работает только для предметов в Table
            abort EItemNotFound
        };
    }

    /// Удаление предмета у игрока (только админ)
    public entry fun admin_remove_item_from_player(
        state: &mut OnePackState,
        admin_cap: &AdminCap,
        item_id: ID,
        ctx: &TxContext,
    ) {
        assert!(admin_cap.admin == ctx.sender(), ENotAuthorized);
        assert!(table::contains(&state.items, item_id), EItemNotFound);

        // Удаляем из листингов если есть
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

    // ========== Функции маркетплейса ==========

    /// Выставление предмета на продажу
    /// Предмет передается в контракт и добавляется в Table
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

        // Добавляем предмет в Table
        table::add(&mut state.items, item_id, item_mut);

        let listing = MarketplaceListing {
            id: object::new(ctx),
            item_id,
            price,
            seller,
            created_at: 0, // TODO: использовать clock::timestamp_ms() если нужен timestamp
        };

        table::add(&mut state.listings, item_id, listing);

        event::emit(ItemListed {
            item_id,
            price,
            seller,
        });
    }

    /// Отмена листинга
    /// Предмет возвращается владельцу
    public entry fun cancel_listing(
        state: &mut OnePackState,
        item_id: ID,
        ctx: &mut TxContext,
    ) {
        assert!(table::contains(&state.items, item_id), EItemNotFound);
        assert!(table::contains(&state.listings, item_id), EItemNotListed);

        // Получаем информацию о предмете
        let item = table::borrow(&state.items, item_id);
        assert!(item.owner == ctx.sender(), ENotAuthorized);
        assert!(item.is_listed, EItemNotListed);
        
        let owner = item.owner;
        
        // Удаляем листинг
        let listing = table::remove(&mut state.listings, item_id);
        let MarketplaceListing { id, item_id: _, price: _, seller: _, created_at: _ } = listing;
        object::delete(id);
        
        // Удаляем предмет из Table и возвращаем владельцу
        let mut item_obj = table::remove(&mut state.items, item_id);
        item_obj.is_listed = false;
        transfer::public_transfer(item_obj, owner);
    }

    /// Покупка предмета на маркетплейсе
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

        // Вычисляем комиссию (2.5%)
        let fee = (price * MARKETPLACE_FEE_BPS) / 10000;
        let seller_amount = price - fee;

        // Переводим токены продавцу
        if (seller_amount > 0) {
            let seller_coin = coin::split(&mut payment, seller_amount, ctx);
            transfer::public_transfer(seller_coin, seller);
        };

        // Сжигаем комиссию (остаток в payment должен быть равен fee)
        coin::burn(treasury_cap, payment);

        // Удаляем листинг
        let listing = table::remove(&mut state.listings, item_id);
        let MarketplaceListing { id: listing_id, item_id: _, price: _, seller: _, created_at: _ } = listing;
        object::delete(listing_id);
        
        // Удаляем предмет из Table и передаем покупателю
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

    // ========== Геттеры ==========

    /// Получение статистики игрока
    public fun get_stats(stats: &PlayerStats): (u64, u64, u64, u64, u64, u64) {
        (stats.wins, stats.losses, stats.total_damage, stats.play_time_seconds, stats.level, stats.rating)
    }

    /// Получение информации о предмете
    public fun get_item_info(item: &GameItem): (u64, u8, u8, address, bool) {
        (item.item_id, item.item_type, item.rarity, item.owner, item.is_listed)
    }

    /// Получение информации о листинге
    public fun get_listing_info(listing: &MarketplaceListing): (ID, u64, address, u64) {
        (listing.item_id, listing.price, listing.seller, listing.created_at)
    }

    /// Получение балансов пула
    public fun get_pool_balances(pool: &SwapPool): (u64, u64) {
        (balance::value(&pool.sui_balance), balance::value(&pool.onepack_balance))
    }
}
