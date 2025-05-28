# Changelog

## [0.5.0]

### Breaking Changes

- **Project Rebranded to Brotocol**:
  - The package scope changed from `@xlink-network` to `@brotocol-xyz`.
  - The main SDK class `XLinkSDK` has been renamed to `BroSDK`.
- **Upgraded @stacks/\* dependencies to v7.x**
  - `bridgeFromStacks.sendTransaction` type signature changed

### Major New Features

- **BRC20 Bridging Support**
  - Implemented full bridging capabilities for BRC20 tokens across multiple chains
  - Added `bridgeFromBRC20` and `estimateBridgeTransactionFromBRC20` APIs
  - Enabled bidirectional transfers between BRC20 and other supported chains

- **Runes Bridging Support**
  - Added comprehensive support for Runes protocol tokens
  - Implemented `bridgeFromRunes` and `estimateBridgeTransactionFromRunes` APIs
  - Added Runestone transaction validation and processing

- **Cross-Chain Swap Capabilities**
  - Implemented cross-chain swaps for seamless token exchanges
  - Enhanced route detection between existing tokens
  - Optimized swap transaction flow with improved fee estimation

- **DEX Aggregator Integrations**
  - Added KyberSwap integration for optimal swap routing
  - Enhanced swap parameter helpers for DEX interactions
  - Added multi-hop routing capabilities for better exchange rates

- **New EVM Chains Support**
  - Added support for Avalanche, Mezo chains
  - Added support for vLiaBTC, STX, TRUMP, GHIBLICZ, WETH, SOL, LINK, and more tokens on EVM chains

- **Dependencies upgrades**
  - Viem -> v2.23.10

### Security Enhancements

- Added hard linkage support to Bitcoin/BRC-20/Runes > \* routes
- Disabled Replace-By-Fee (RBF) for Bitcoin transactions by default
- Enhanced validation for bridge transactions
- Improved error handling for malformed transaction data

### Bug Fixes

- Fixed reserve limitation not working on \* > EVM routes
- Fixed fixed fee rate token incorrect for Stacks > Meta routes
- Resolved edge cases in cross-chain transaction validation
- Fixed various minor issues and edge cases

### Other Changes

- Added cross-chain swap example code for developer reference
- Multiple Stacks contract upgrades
- Support for new fee charge model
- Upgraded viem dependency
- Improved code organization and documentation
- Enhanced type safety with improved TypeScript definitions
