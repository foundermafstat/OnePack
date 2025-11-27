# OnePack

A comprehensive OneChain blockchain dApp built with Next.js 16, featuring the BattlePackArena game with integrated tokenomics, marketplace, and player statistics system.

## Table of Contents

- [Overview](#overview)
- [Project Structure](#project-structure)
- [Smart Contract Architecture](#smart-contract-architecture)
- [Core Modules](#core-modules)
  - [Tokenomics](#tokenomics)
  - [Swap Pool (AMM)](#swap-pool-amm)
  - [Marketplace](#marketplace)
  - [Player Statistics (SBT)](#player-statistics-sbt)
  - [Game Items (NFT)](#game-items-nft)
- [Technical Implementation](#technical-implementation)
- [Contract Functions](#contract-functions)
- [Events](#events)
- [Data Structures](#data-structures)
- [Security Features](#security-features)
- [Getting Started](#getting-started)
- [Deployment](#deployment)

## Overview

OnePack is a blockchain-based gaming platform that combines:

- **Game Mechanics**: Grid-based inventory management with drag & drop, merging, and battle systems
- **Tokenomics**: Native ONEPACK token with AMM-based swap functionality
- **NFT Marketplace**: Decentralized marketplace for trading game items
- **Player Progression**: Soulbound Token (SBT) system for tracking player statistics
- **IPFS Integration**: Decentralized storage for game results and backpack states

## Project Structure

```
OnePack/
├── client/          # Next.js 16 frontend application
│   ├── app/         # Next.js app directory
│   ├── lib/         # Contract interaction utilities
│   └── components/  # React components including BattlePackArena
├── server/          # Backend server (to be implemented)
└── contracts/       # OneChain Move smart contracts
    ├── sources/
    │   └── onepack.move  # Main contract module
    ├── build/       # Compiled contract artifacts
    └── contract-config.json  # Deployment configuration
```

## Smart Contract Architecture

The OnePack smart contract is a unified Move module (`onepack::onepack`) deployed on the OneChain blockchain. It implements a comprehensive game economy with the following key components:

### Core Design Principles

1. **Shared Object Pattern**: The main `OnePackState` is a shared object, allowing concurrent access from multiple users
2. **Owned Objects**: Game items and player stats are owned objects, providing direct ownership and transfer capabilities
3. **Table Storage**: Efficient key-value storage for items, listings, and player statistics
4. **Capability-Based Access Control**: Admin functions protected by `AdminCap` capability

### Module Structure

```
onepack::onepack
├── Constants & Errors
├── Type Definitions
│   ├── ONEPACK (One-Time Witness)
│   └── Core Structures
├── Initialization
├── Token Functions
├── Swap Pool Functions
├── Player Statistics Functions
├── Game Item Functions
├── Marketplace Functions
└── Getter Functions
```

## Core Modules

### Tokenomics

The contract implements a native game token `ONEPACK` with the following characteristics:

- **Token Standard**: OneChain Coin standard
- **Decimals**: 9
- **Symbol**: ONEPACK
- **Name**: OnePack Game Token
- **Supply Control**: Managed via `TreasuryCap` (admin-controlled minting)

#### Key Functions

- `admin_mint_tokens()`: Admin-only function to mint ONEPACK tokens to specific addresses
- Token transfers use standard OneChain `transfer::public_transfer()`

### Swap Pool (AMM)

The contract implements a Constant Product Automated Market Maker (AMM) for swapping between OCT (OneChain Token) and ONEPACK tokens.

#### AMM Formula

Uses the constant product formula: `x * y = k`

Where:

- `x` = OCT (OneChain Token) balance in pool
- `y` = ONEPACK balance in pool
- `k` = Constant product (preserved during swaps)

#### Swap Calculation

For OCT → ONEPACK:

```
dy = (y * dx) / (x + dx)
```

For ONEPACK → OCT:

```
dx = (x * dy) / (y + dy)
```

#### Key Functions

- `init_swap_pool()`: Initialize the swap pool with initial liquidity (admin only)
- `swap_sui_to_onepack()`: Swap OCT (OneChain Token) for ONEPACK tokens
- `swap_onepack_to_sui()`: Swap ONEPACK tokens for OCT (OneChain Token)
- `add_liquidity()`: Add liquidity to the pool (admin only)
- `get_pool_balances()`: Query current pool balances

#### Features

- **Slippage Protection**: `min_onepack_out` and `min_oct_out` parameters
- **Minimum Liquidity**: Enforced `MIN_LIQUIDITY` constant (1000 units)
- **Price Discovery**: Automatic price discovery based on supply and demand

### Marketplace

A decentralized marketplace for trading game items (NFTs) with the following features:

#### Marketplace Mechanics

- **Listing**: Players can list their items for sale in ONEPACK tokens
- **Buying**: Other players can purchase listed items
- **Fee Structure**: 2.5% marketplace fee (250 basis points)
- **Fee Distribution**: Fees are burned (deflationary mechanism)

#### Listing Flow

1. Item owner calls `list_item()` with item and price
2. Item is transferred to contract storage (Table)
3. Listing is created and added to listings table
4. Item becomes available for purchase

#### Purchase Flow

1. Buyer calls `buy_item()` with item ID and payment
2. Contract calculates fee (2.5%) and seller amount
3. Payment is split: seller receives (price - fee), fee is burned
4. Item ownership is transferred to buyer
5. Item is removed from marketplace

#### Key Functions

- `list_item()`: List an item for sale on the marketplace
- `cancel_listing()`: Cancel an active listing and return item to owner
- `buy_item()`: Purchase a listed item
- `get_listing_info()`: Query listing information

### Player Statistics (SBT)

Soulbound Tokens (SBT) for tracking player progression and achievements. These tokens are non-transferable and permanently linked to the player's address.

#### Statistics Tracked

- **Wins**: Number of games won
- **Losses**: Number of games lost
- **Total Damage**: Cumulative damage dealt
- **Play Time**: Total play time in seconds
- **Level**: Player level (calculated from total games)
- **Rating**: Player rating (calculated from win rate and wins)
- **Game Result IPFS**: IPFS URL for game result history
- **Backpack IPFS**: IPFS URL for backpack state snapshot

#### Level & Rating Calculation

```move
level = 1 + (total_games / 10)
win_rate = (wins * 100) / total_games
rating = 1000 + (win_rate * 10) + (wins * 5)
```

#### Key Functions

- `create_player_stats()`: Create initial player statistics SBT
- `update_stats()`: Update player statistics (internal, called by contract)
- `update_game_result_ipfs()`: Update IPFS URL for game results
- `update_backpack_ipfs()`: Update IPFS URL for backpack state
- `get_stats()`: Query player statistics

### Game Items (NFT)

Game items are NFTs representing in-game assets with the following properties:

#### Item Properties

- **item_id**: Unique item identifier (u64)
- **item_type**: Item type/category (u8)
- **rarity**: Item rarity level (u8)
- **name**: Item name (vector<u8>)
- **description**: Item description (vector<u8>)
- **image_url**: Item image URL (vector<u8>)
- **ipfs_metadata_url**: IPFS URL for additional metadata
- **owner**: Current owner address
- **is_listed**: Marketplace listing status

#### Item Lifecycle

1. **Minting**: Admin mints items via `admin_mint_item()`
2. **Ownership**: Items are owned objects, directly transferable
3. **Listing**: Items can be listed on marketplace
4. **Trading**: Items can be bought/sold on marketplace
5. **Burning**: Admin can delete items via `admin_delete_item()`

#### Key Functions

- `admin_mint_item()`: Create new game item (admin only)
- `admin_edit_item()`: Edit item metadata (admin only)
- `admin_delete_item()`: Delete item from contract (admin only)
- `admin_add_item_to_player()`: Add item from marketplace to player
- `admin_remove_item_from_player()`: Remove item from player
- `get_item_info()`: Query item information

## Technical Implementation

### Storage Architecture

#### Shared Objects

- **OnePackState**: Main contract state (shared object)
  - Stores references to admin capabilities
  - Contains Tables for items, listings, and player stats
  - Manages swap pool reference

#### Owned Objects

- **GameItem**: Individual game items (owned by players)
- **PlayerStats**: Player statistics SBT (owned by players)
- **AdminCap**: Admin capability (owned by admin)
- **TreasuryCap**: Token minting capability (owned by admin)

#### Tables

- **items**: `Table<ID, GameItem>` - Storage for listed items
- **listings**: `Table<ID, MarketplaceListing>` - Active marketplace listings
- **player_stats**: `Table<address, ID>` - Mapping of player addresses to stats IDs

### Error Handling

The contract defines custom error codes:

- `ENotAuthorized` (0): Unauthorized access attempt
- `EInsufficientFunds` (1): Insufficient funds for operation
- `EItemNotFound` (2): Item not found in storage
- `EItemAlreadyListed` (3): Item already listed on marketplace
- `EItemNotListed` (4): Item not listed on marketplace
- `EInsufficientLiquidity` (5): Insufficient liquidity in swap pool
- `EPoolNotInitialized` (6): Swap pool not initialized
- `EInvalidPrice` (7): Invalid price value
- `EStatsAlreadyExists` (8): Player stats already exist

### Access Control

- **Admin Functions**: Protected by `AdminCap` capability check
- **Owner Functions**: Protected by ownership verification
- **Public Functions**: Accessible to all users (with appropriate checks)

## Contract Functions

### Initialization

#### `init()`

Initializes the contract module:

- Creates ONEPACK token with metadata
- Creates AdminCap with deployer as admin
- Creates OnePackState shared object
- Transfers capabilities to deployer

### Token Functions

#### `admin_mint_tokens()`

- **Access**: Admin only
- **Parameters**: `amount`, `recipient`
- **Functionality**: Mints ONEPACK tokens to specified address
- **Events**: Emits `TokenMinted`

### Swap Pool Functions

#### `init_swap_pool()`

- **Access**: Admin only
- **Parameters**: `initial_oct`, `initial_onepack`
- **Functionality**: Initializes AMM pool with initial liquidity
- **Requirements**: Minimum liquidity check

#### `swap_sui_to_onepack()`

- **Access**: Public
- **Parameters**: `oct_coin`, `min_onepack_out`
- **Functionality**: Swaps OCT (OneChain Token) for ONEPACK using constant product formula
- **Events**: Emits `SwapExecuted`

#### `swap_onepack_to_sui()`

- **Access**: Public
- **Parameters**: `onepack_coin`, `min_oct_out`
- **Functionality**: Swaps ONEPACK for OCT (OneChain Token) using constant product formula
- **Events**: Emits `SwapExecuted`

#### `add_liquidity()`

- **Access**: Admin only
- **Parameters**: `oct_coin`, `onepack_amount`
- **Functionality**: Adds liquidity to the swap pool

### Player Statistics Functions

#### `create_player_stats()`

- **Access**: Public
- **Functionality**: Creates initial player statistics SBT
- **Initial Values**: All stats start at 0, level 1, rating 1000

#### `update_stats()`

- **Access**: Internal (called by contract)
- **Parameters**: `wins_delta`, `losses_delta`, `damage_delta`, `time_delta`
- **Functionality**: Updates player statistics and recalculates level/rating
- **Events**: Emits `StatsUpdated`

#### `update_game_result_ipfs()`

- **Access**: Owner only
- **Parameters**: `ipfs_url`
- **Functionality**: Updates IPFS URL for game results
- **Events**: Emits `GameResultRecorded`

#### `update_backpack_ipfs()`

- **Access**: Owner only
- **Parameters**: `ipfs_url`
- **Functionality**: Updates IPFS URL for backpack state

### Game Item Functions

#### `admin_mint_item()`

- **Access**: Admin only
- **Parameters**: Item metadata (id, type, rarity, name, description, URLs, owner)
- **Functionality**: Creates new game item and transfers to owner
- **Events**: Emits `ItemMinted`

#### `admin_edit_item()`

- **Access**: Admin only
- **Parameters**: `item_id`, new metadata fields
- **Functionality**: Updates item metadata

#### `admin_delete_item()`

- **Access**: Admin only
- **Parameters**: `item_id`
- **Functionality**: Deletes item from contract (removes from marketplace if listed)
- **Events**: Emits `ItemBurned`

#### `admin_add_item_to_player()`

- **Access**: Admin only
- **Parameters**: `item_id`, `player`
- **Functionality**: Transfers item from marketplace to player

#### `admin_remove_item_from_player()`

- **Access**: Admin only
- **Parameters**: `item_id`
- **Functionality**: Removes item from player and deletes it
- **Events**: Emits `ItemBurned`

### Marketplace Functions

#### `list_item()`

- **Access**: Owner only
- **Parameters**: `item`, `price`
- **Functionality**: Lists item for sale on marketplace
- **Events**: Emits `ItemListed`

#### `cancel_listing()`

- **Access**: Owner only
- **Parameters**: `item_id`
- **Functionality**: Cancels listing and returns item to owner

#### `buy_item()`

- **Access**: Public
- **Parameters**: `item_id`, `payment`
- **Functionality**: Purchases listed item, transfers payment to seller (minus fee), burns fee
- **Events**: Emits `ItemSold`

### Getter Functions

#### `get_stats()`

Returns player statistics: `(wins, losses, total_damage, play_time, level, rating)`

#### `get_item_info()`

Returns item information: `(item_id, item_type, rarity, owner, is_listed)`

#### `get_listing_info()`

Returns listing information: `(item_id, price, seller, created_at)`

#### `get_pool_balances()`

Returns swap pool balances: `(oct_balance, onepack_balance)`

## Events

The contract emits events for all major operations:

### `ItemMinted`

Emitted when a new item is created:

- `item_id`, `item_type`, `rarity`, `owner`

### `ItemListed`

Emitted when an item is listed on marketplace:

- `item_id`, `price`, `seller`

### `ItemSold`

Emitted when an item is purchased:

- `item_id`, `price`, `seller`, `buyer`, `fee`

### `ItemBurned`

Emitted when an item is deleted:

- `item_id`

### `TokenMinted`

Emitted when tokens are minted:

- `recipient`, `amount`

### `SwapExecuted`

Emitted when a swap occurs:

- `from_token`, `to_token`, `amount_in`, `amount_out`, `user`

### `StatsUpdated`

Emitted when player statistics are updated:

- `player`, `wins`, `losses`, `level`, `rating`

### `GameResultRecorded`

Emitted when game result IPFS is updated:

- `player`, `ipfs_url`

## Data Structures

### `OnePackState`

Main contract state (shared object):

```move
struct OnePackState {
    id: UID,
    admin_cap: ID,
    treasury_cap: ID,
    swap_pool: Option<ID>,
    items: Table<ID, GameItem>,
    listings: Table<ID, MarketplaceListing>,
    player_stats: Table<address, ID>,
}
```

### `SwapPool`

AMM liquidity pool:

```move
struct SwapPool {
    id: UID,
    oct_balance: Balance<OCT>,
    onepack_balance: Balance<ONEPACK>,
    k: u128,  // Constant product
}
```

### `GameItem`

Game item NFT:

```move
struct GameItem {
    id: UID,
    item_id: u64,
    item_type: u8,
    rarity: u8,
    name: vector<u8>,
    description: vector<u8>,
    image_url: vector<u8>,
    ipfs_metadata_url: vector<u8>,
    owner: address,
    is_listed: bool,
}
```

### `PlayerStats`

Player statistics SBT:

```move
struct PlayerStats {
    id: UID,
    player: address,
    wins: u64,
    losses: u64,
    total_damage: u64,
    play_time_seconds: u64,
    level: u64,
    rating: u64,
    game_result_ipfs: vector<u8>,
    backpack_ipfs: vector<u8>,
}
```

### `MarketplaceListing`

Marketplace listing:

```move
struct MarketplaceListing {
    id: UID,
    item_id: ID,
    price: u64,
    seller: address,
    created_at: u64,
}
```

### `AdminCap`

Admin capability:

```move
struct AdminCap {
    id: UID,
    admin: address,
}
```

## Security Features

### Access Control

- **Capability-Based**: Admin functions require `AdminCap`
- **Ownership Verification**: Item operations verify ownership
- **Sender Validation**: All functions validate `ctx.sender()`

### Input Validation

- **Price Validation**: Ensures prices are positive
- **Balance Checks**: Verifies sufficient funds before operations
- **Liquidity Checks**: Validates pool liquidity for swaps
- **Slippage Protection**: Minimum output amounts for swaps

### State Consistency

- **Atomic Operations**: All state changes are atomic
- **Table Consistency**: Items and listings are kept in sync
- **Balance Tracking**: Pool balances are accurately maintained

### Economic Security

- **Fee Mechanism**: Marketplace fees prevent spam
- **Deflationary**: Fees are burned, reducing token supply
- **Liquidity Protection**: Minimum liquidity requirements

## Getting Started

### Prerequisites

- Node.js 18+ and npm/pnpm
- OneChain CLI installed
- OneChain wallet

### Client Setup

```bash
cd client
npm install
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see the application.

### Contract Development

```bash
cd contracts
# Build contract
onechain move build

# Run tests
onechain move test

# Deploy to testnet
onechain client publish --gas-budget 100000000
```

## Deployment

### Contract Configuration

The contract deployment configuration is stored in `contracts/contract-config.json`:

```json
{
	"network": "onechain-testnet",
	"packageId": "0x...",
	"adminCapId": "0x...",
	"treasuryCapId": "0x...",
	"onePackStateId": "0x...",
	"coinTypeTag": "0x...::onepack::ONEPACK"
}
```

### Deployment Steps

1. **Build the contract**:

   ```bash
   onechain move build
   ```

2. **Publish to network**:

   ```bash
   onechain client publish --gas-budget 100000000
   ```

3. **Initialize swap pool** (after deployment):

   ```move
   init_swap_pool(
       state,
       admin_cap,
       treasury_cap,
       initial_oct_coin,
       initial_onepack_amount
   )
   ```

4. **Update client configuration** with deployed contract addresses

### Post-Deployment

- Store admin capabilities securely
- Initialize swap pool with initial liquidity
- Configure frontend with contract addresses
- Set up IPFS for metadata storage

## Tech Stack

### Frontend

- **Framework**: Next.js 16
- **UI Library**: React 19
- **Language**: TypeScript
- **Blockchain SDK**: OneChain SDK
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **State Management**: @tanstack/react-query
- **Drag & Drop**: Custom implementation

### Smart Contract

- **Language**: Move
- **Platform**: OneChain Blockchain
- **Network**: OneChain Testnet
- **Storage**: OneChain Objects (Owned & Shared)
- **Token Standard**: OneChain Coin Standard

## Future Enhancements

Potential improvements and features:

- [ ] LP token rewards for liquidity providers
- [ ] Staking mechanism for ONEPACK tokens
- [ ] Governance system for community decisions
- [ ] Multi-item batch operations
- [ ] Auction system for rare items
- [ ] Cross-chain bridge integration
- [ ] Advanced statistics and leaderboards
- [ ] Item upgrade/evolution system

## License

[Add your license here]

## Contributing

[Add contributing guidelines here]

## Support

[Add support information here]
