# Task: Address PR Comments

## Overview
Address all review comments from PR #23 (feat/tron-support)
Total comments found: 19

## First Pass - Unambiguous Comments

### 1. Move TronToken/StacksToken conversion functions
- **File**: `src/BroSDK.ts:1198`
- **Comment**: Move `tronTokenToStacksToken` and related functions to `src/lowlevelUnstableInfos.ts`
- **Action**: Move these functions to maintain consistency with EVMToken handling

### 2. Add TODO comment for Solana support
- **File**: `src/evmUtils/peggingHelpers.ts:598`
- **Comment**: Add `TODO:` mark for the Solana support section
- **Action**: Add TODO comment before the "Waiting for backend support" section

### 3. Replace with UnsupportedBridgeRouteError (EVM to Solana)
- **File**: `src/sdkUtils/bridgeFromEVM.ts:536`
- **Comment**: Replace the temporary error with `UnsupportedBridgeRouteError`
- **Action**: Remove the temporary implementation and throw proper error

### 4. Replace with UnsupportedBridgeRouteError (Solana bridge)
- **File**: `src/sdkUtils/bridgeFromSolana.ts:556`
- **Comment**: Use `UnsupportedBridgeRouteError` here
- **Action**: Replace current error with UnsupportedBridgeRouteError

### 5. Fix indentation issue
- **File**: `src/sdkUtils/bridgeFromEVM.ts:619`
- **Comment**: "What's the issue here? Why did we change the indentation?"
- **Action**: Revert unnecessary indentation changes

### 6. Convert Solana Transaction to Uint8Array
- **File**: `src/sdkUtils/bridgeFromSolana.ts:60`
- **Comment**: Avoid exposing Solana instances, convert to Uint8Array
- **Action**: Convert Transaction return type to avoid version conflicts

### 7. Use getAssociatedTokenAddress function
- **File**: `src/sdkUtils/bridgeFromSolana.ts:57`
- **Comment**: Use `@solana/spl-token`'s `getAssociatedTokenAddress` function
- **Action**: Replace manual calculation with the library function

### 8. Fix Tron chainId inconsistency
- **File**: `src/stacksUtils/crossContractDataMapping.ts:211`
- **Comment**: The chainId for Tron should be 20n (not what's currently there)
- **Action**: Update to match the correct chainId

### 9. Remove SDK runtime environments
- **File**: `src/sdkUtils/types.internal.ts:39`
- **Comment**: SDK users do not need to know about these runtime envs
- **Action**: Remove or move to internal-only types

### 10. Hard linkage doesn't support * > Solana routes
- **File**: `src/sdkUtils/estimateBridgeTransactionFromRunes.ts:446`
- **Comment**: Hard linkage does not support routes `* > Solana`
- **Action**: Add proper error handling or remove unsupported route

## Second Pass - Comments Requiring Clarification

### 11. TODO: fix this comment
- **File**: `src/sdkUtils/bridgeFromEVM.ts:544`
- **Comment**: "what's the problem here?" and "TODO: fix this"
- **Action**: Need clarification on the actual issue with `solanaTokenAddress as 0x${string}`

### 12. Draft EVM message
- **File**: `src/sdkUtils/bridgeFromEVM.ts:544`
- **Comment**: "we can draft a message and add it to `src/evmUtils/contractMessageHelpers.ts` first"
- **Action**: Need more context on the required message format

### 13. Assert exclude questions (2 instances)
- **File**: `src/sdkUtils/bridgeFromRunes.ts:300, 304`
- **Comments**: Two "?" comments on assertExclude changes
- **Action**: Need clarification on why these changes were made

### 14. Question mark on stxContractAddresses
- **File**: `src/stacksUtils/stxContractAddresses.ts:204`
- **Comment**: "?"
- **Action**: Need clarification on what needs to be fixed

### 15. SwapRouteHelpers comment
- **File**: `src/utils/SwapRouteHelpers.ts:635`
- **Comment**: "what do you mean?"
- **Action**: Need to understand the context of the code/comment

### 16. TypeScript config question
- **File**: `tsconfig.json:25`
- **Comment**: "Why do we need to enable this? From my experience, it is often the source of chaos."
- **Action**: Need to understand which option is being questioned and why it was enabled

### 17. Solana Buffer fix discussion
- **File**: `src/solanaUtils/solanaLibraryBufferFix.ts:6`
- **Comments**: Discussion about Buffer necessity - resolved by zhigang1992 that @solana/spl-token still needs it
- **Action**: Keep the Buffer fix but add comment explaining why it's needed

## Status
- [x] Move TronToken/StacksToken functions
- [x] Add TODO comment for Solana
- [x] Replace with UnsupportedBridgeRouteError (EVM to Solana)
- [x] Replace with UnsupportedBridgeRouteError (Solana bridge)
- [x] Fix indentation
- [x] Convert Solana Transaction to Uint8Array
- [x] Use getAssociatedTokenAddress function
- [x] Fix Tron chainId inconsistency
- [x] Remove SDK runtime environments (added @internal comment)
- [x] Handle hard linkage Solana routes
- [ ] Clarify TODO: fix this
- [ ] Draft EVM message
- [ ] Clarify assertExclude changes
- [ ] Clarify stxContractAddresses question
- [ ] Clarify SwapRouteHelpers comment
- [ ] Review TypeScript config change
- [ ] Document Solana Buffer fix reason