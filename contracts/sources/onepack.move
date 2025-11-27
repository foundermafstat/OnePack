/// OnePack Move Smart Contract
/// This is a basic template for the OnePack game contract

module onepack::onepack {
    use sui::object::{Self, UID};
    use sui::tx_context::{Self, TxContext};
    use sui::transfer;
    use std::vector;

    /// Game item struct
    struct GameItem has key, store {
        id: UID,
        item_id: u64,
        item_type: u8,
        rarity: u8,
    }

    /// Player inventory struct
    struct PlayerInventory has key {
        id: UID,
        items: vector<GameItem>,
    }

    /// Initialize the module
    fun init(ctx: &mut TxContext) {
        // Module initialization logic
    }

    /// Create a new game item
    public fun create_item(
        item_id: u64,
        item_type: u8,
        rarity: u8,
        ctx: &mut TxContext
    ): GameItem {
        GameItem {
            id: object::new(ctx),
            item_id,
            item_type,
            rarity,
        }
    }

    /// Get item ID
    public fun item_id(item: &GameItem): u64 {
        item.item_id
    }

    /// Get item type
    public fun item_type(item: &GameItem): u8 {
        item.item_type
    }

    /// Get item rarity
    public fun rarity(item: &GameItem): u8 {
        item.rarity
    }

    /// Create a new player inventory
    public fun create_inventory(ctx: &mut TxContext): PlayerInventory {
        PlayerInventory {
            id: object::new(ctx),
            items: vector::empty(),
        }
    }

    /// Get inventory size
    public fun inventory_size(inventory: &PlayerInventory): u64 {
        vector::length(&inventory.items)
    }

    /// Add item to inventory
    public fun add_item_to_inventory(
        inventory: &mut PlayerInventory,
        item: GameItem
    ) {
        vector::push_back(&mut inventory.items, item);
    }
}

