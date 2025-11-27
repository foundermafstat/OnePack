# OnePack Smart Contracts

Sui Move smart contracts for the OnePack game.

## Prerequisites

To work with Sui Move contracts, you need to install Sui CLI:

### Option 1: Install via Homebrew (macOS)
```bash
brew install sui
```

### Option 2: Install via Cargo
```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch devnet sui
```

### Option 3: Use Pre-built Binaries
Visit [Sui Documentation](https://docs.sui.io/build/install) for the latest installation instructions.

## Project Structure

```
contracts/
├── Move.toml          # Move package configuration
├── sources/           # Move source files
│   └── onepack.move  # Main contract module
└── tests/            # Move test files
    └── onepack_tests.move
```

## Building

```bash
sui move build
```

## Testing

```bash
sui move test
```

## Deployment to Testnet

1. **Set up Sui CLI for testnet:**
   ```bash
   sui client new-env --alias testnet --rpc https://fullnode.testnet.sui.io:443
   sui client switch --env testnet
   ```

2. **Get testnet SUI tokens:**
   - Visit [Sui Testnet Faucet](https://discord.com/channels/916379725201563759/971488439931392130)
   - Or use: `sui client faucet`

3. **Build and publish:**
   ```bash
   sui move build
   sui client publish --gas-budget 100000000
   ```

## Configuration

The `Move.toml` file is configured to use:
- **Sui Framework**: Latest mainnet version
- **Move Stdlib**: Latest mainnet version
- **Package Name**: `onepack`
- **Address**: `0x0` (will be replaced during deployment)

## Development

### Adding New Modules

1. Create a new `.move` file in `sources/`
2. Add the module to your package
3. Update `Move.toml` if needed

### Testing

Write unit tests in the `tests/` directory. Tests use the `#[test]` attribute and `test_scenario` for transaction simulation.

## Resources

- [Sui Documentation](https://docs.sui.io)
- [Move Language Documentation](https://move-language.github.io/move/)
- [Sui Move Examples](https://github.com/MystenLabs/sui/tree/main/sui_programmability/examples)

