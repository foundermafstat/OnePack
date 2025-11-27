#[test_only]
module onepack::onepack_tests {
    use sui::test_scenario::{Self, Scenario};
    use sui::test_utils;
    use onepack::onepack::{Self, GameItem, PlayerInventory};

    #[test]
    fun test_create_item() {
        let mut scenario = test_scenario::begin(@0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let item = onepack::create_item(1, 1, 1, ctx);
            assert!(onepack::item_id(&item) == 1, 0);
            assert!(onepack::item_type(&item) == 1, 1);
            assert!(onepack::rarity(&item) == 1, 2);
        };
        test_scenario::end(scenario);
    }

    #[test]
    fun test_create_inventory() {
        let mut scenario = test_scenario::begin(@0x1);
        {
            let ctx = test_scenario::ctx(&mut scenario);
            let inventory = onepack::create_inventory(ctx);
            assert!(onepack::inventory_size(&inventory) == 0, 0);
        };
        test_scenario::end(scenario);
    }
}

