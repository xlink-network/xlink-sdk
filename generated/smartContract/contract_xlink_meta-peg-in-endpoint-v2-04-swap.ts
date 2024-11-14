
import {
defineContract,
tupleT,
optionalT,
uintT,
bufferT,
listT,
traitT,
responseSimpleT,
booleanT,
stringT,
principalT,
noneT
} from "../smartContractHelpers/codegenImport"

export const metaPegInEndpointV204Swap = defineContract({
"meta-peg-in-endpoint-v2-04-swap": {
  'finalize-peg-in-add-liquidity': {
    input: [
      {
        name: 'commit-tx',
        type: tupleT({ 'fee-idx': optionalT(uintT, ), 'output-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-tx',
        type: tupleT({ 'order-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-block',
        type: tupleT({ header: bufferT, height: uintT }, )
      },
      {
        name: 'reveal-proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      },
      { name: 'dx-idx', type: uintT },
      { name: 'token-trait', type: traitT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'finalize-peg-in-add-liquidity-on-index': {
    input: [
      {
        name: 'tx',
        type: tupleT({
          amt: uintT,
          'bitcoin-tx': bufferT,
          decimals: uintT,
          from: bufferT,
          'from-bal': uintT,
          output: uintT,
          tick: stringT,
          to: bufferT,
          'to-bal': uintT
        }, )
      },
      {
        name: 'block',
        type: tupleT({ header: bufferT, height: uintT }, )
      },
      {
        name: 'proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      },
      {
        name: 'signature-packs',
        type: listT(tupleT({ signature: bufferT, signer: principalT, 'tx-hash': bufferT }, ), )
      },
      {
        name: 'reveal-tx',
        type: tupleT({ 'order-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-block',
        type: tupleT({ header: bufferT, height: uintT }, )
      },
      {
        name: 'reveal-proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      },
      { name: 'dx-idx', type: uintT },
      { name: 'fee-idx', type: optionalT(uintT, ) },
      { name: 'token-trait', type: traitT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'finalize-peg-in-create-pool': {
    input: [
      {
        name: 'commit-tx',
        type: tupleT({ 'fee-idx': optionalT(uintT, ), 'output-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-tx',
        type: tupleT({ 'order-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-block',
        type: tupleT({ header: bufferT, height: uintT }, )
      },
      {
        name: 'reveal-proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      },
      { name: 'dx-idx', type: uintT },
      { name: 'token-trait', type: traitT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'finalize-peg-in-create-pool-on-index': {
    input: [
      {
        name: 'tx',
        type: tupleT({
          amt: uintT,
          'bitcoin-tx': bufferT,
          decimals: uintT,
          from: bufferT,
          'from-bal': uintT,
          output: uintT,
          tick: stringT,
          to: bufferT,
          'to-bal': uintT
        }, )
      },
      {
        name: 'block',
        type: tupleT({ header: bufferT, height: uintT }, )
      },
      {
        name: 'proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      },
      {
        name: 'signature-packs',
        type: listT(tupleT({ signature: bufferT, signer: principalT, 'tx-hash': bufferT }, ), )
      },
      {
        name: 'reveal-tx',
        type: tupleT({ 'order-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-block',
        type: tupleT({ header: bufferT, height: uintT }, )
      },
      {
        name: 'reveal-proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      },
      { name: 'dx-idx', type: uintT },
      { name: 'fee-idx', type: optionalT(uintT, ) },
      { name: 'token-trait', type: traitT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'finalize-peg-in-cross-swap': {
    input: [
      {
        name: 'commit-tx',
        type: tupleT({ 'fee-idx': optionalT(uintT, ), 'output-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-tx',
        type: tupleT({ 'order-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-block',
        type: tupleT({ header: bufferT, height: uintT }, )
      },
      {
        name: 'reveal-proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      },
      { name: 'routing-traits', type: listT(traitT, ) },
      { name: 'token-out-trait', type: traitT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'finalize-peg-in-cross-swap-on-index': {
    input: [
      {
        name: 'tx',
        type: tupleT({
          amt: uintT,
          'bitcoin-tx': bufferT,
          decimals: uintT,
          from: bufferT,
          'from-bal': uintT,
          output: uintT,
          tick: stringT,
          to: bufferT,
          'to-bal': uintT
        }, )
      },
      {
        name: 'block',
        type: tupleT({ header: bufferT, height: uintT }, )
      },
      {
        name: 'proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      },
      {
        name: 'signature-packs',
        type: listT(tupleT({ signature: bufferT, signer: principalT, 'tx-hash': bufferT }, ), )
      },
      {
        name: 'reveal-tx',
        type: tupleT({ 'order-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-block',
        type: tupleT({ header: bufferT, height: uintT }, )
      },
      {
        name: 'reveal-proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      },
      { name: 'fee-idx', type: optionalT(uintT, ) },
      { name: 'routing-traits', type: listT(traitT, ) },
      { name: 'token-out-trait', type: traitT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'finalize-peg-in-remove-liquidity': {
    input: [
      {
        name: 'commit-tx',
        type: tupleT({ 'fee-idx': optionalT(uintT, ), tx: bufferT }, )
      },
      {
        name: 'block',
        type: tupleT({ header: bufferT, height: uintT }, )
      },
      {
        name: 'proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      },
      {
        name: 'reveal-tx',
        type: tupleT({ 'order-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-block',
        type: tupleT({ header: bufferT, height: uintT }, )
      },
      {
        name: 'reveal-proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      },
      { name: 'token-trait', type: traitT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  pause: {
    input: [ { name: 'new-paused', type: booleanT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-fee-to-address': {
    input: [ { name: 'new-fee-to-address', type: principalT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-peg-in-fee': {
    input: [ { name: 'fee', type: uintT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'transfer-all-to': {
    input: [
      { name: 'new-owner', type: principalT },
      { name: 'token-trait', type: traitT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'transfer-all-to-many': {
    input: [
      { name: 'new-owner', type: principalT },
      { name: 'token-traits', type: listT(traitT, ) }
    ],
    output: responseSimpleT(listT(responseSimpleT(booleanT, ), ), ),
    mode: 'public'
  },
  'update-pool-setting': {
    input: [
      {
        name: 'new-pool-setting',
        type: tupleT({
          'fee-rate-x': uintT,
          'fee-rate-y': uintT,
          'max-in-ratio': uintT,
          'max-out-ratio': uintT,
          memo: optionalT(bufferT, ),
          'oracle-average': uintT,
          'oracle-enabled': booleanT,
          'start-block': uintT,
          'threshold-x': uintT,
          'threshold-y': uintT
        }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'break-routing-id': {
    input: [
      { name: 'token-in', type: principalT },
      { name: 'routing-ids', type: listT(uintT, ) }
    ],
    output: responseSimpleT(tupleT({
      'routing-factors': listT(uintT, ),
      'routing-tokens': listT(principalT, )
    }, ), ),
    mode: 'readonly'
  },
  'create-order-add-liquidity-or-fail': {
    input: [
      {
        name: 'order',
        type: tupleT({
          factor: uintT,
          from: bufferT,
          'max-dy': optionalT(uintT, ),
          token: principalT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'create-order-create-pool-or-fail': {
    input: [
      {
        name: 'order',
        type: tupleT({ burn: booleanT, factor: uintT, from: bufferT, token: principalT }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'create-order-cross-swap-or-fail': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'chain-id': optionalT(uintT, ),
          from: bufferT,
          'min-amount-out': optionalT(uintT, ),
          routing: listT(uintT, ),
          to: bufferT,
          'token-out': principalT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'create-order-remove-liquidity-or-fail': {
    input: [
      {
        name: 'order',
        type: tupleT({ amount: uintT, 'chain-id': uintT, from: bufferT, 'pool-id': uintT }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'decode-order-add-liquidity-from-reveal-tx-or-fail': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'order-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({
      'commit-txid': bufferT,
      'order-details': tupleT({
        factor: uintT,
        from: bufferT,
        'max-dy': optionalT(uintT, ),
        token: principalT
      }, )
    }, ), ),
    mode: 'readonly'
  },
  'decode-order-add-liquidity-or-fail': {
    input: [ { name: 'order-script', type: bufferT } ],
    output: responseSimpleT(tupleT({
      factor: uintT,
      from: bufferT,
      'max-dy': optionalT(uintT, ),
      token: principalT
    }, ), ),
    mode: 'readonly'
  },
  'decode-order-create-pool-from-reveal-tx-or-fail': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'order-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({
      'commit-txid': bufferT,
      'order-details': tupleT({ burn: booleanT, factor: uintT, from: bufferT, token: principalT }, )
    }, ), ),
    mode: 'readonly'
  },
  'decode-order-create-pool-or-fail': {
    input: [ { name: 'order-script', type: bufferT } ],
    output: responseSimpleT(tupleT({ burn: booleanT, factor: uintT, from: bufferT, token: principalT }, ), ),
    mode: 'readonly'
  },
  'decode-order-cross-swap-from-reveal-tx-or-fail': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'order-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({
      'commit-txid': bufferT,
      'order-details': tupleT({
        'chain-id': optionalT(uintT, ),
        from: bufferT,
        'min-amount-out': optionalT(uintT, ),
        routing: listT(uintT, ),
        to: bufferT,
        'token-out': principalT
      }, )
    }, ), ),
    mode: 'readonly'
  },
  'decode-order-cross-swap-or-fail': {
    input: [ { name: 'order-script', type: bufferT } ],
    output: responseSimpleT(tupleT({
      'chain-id': optionalT(uintT, ),
      from: bufferT,
      'min-amount-out': optionalT(uintT, ),
      routing: listT(uintT, ),
      to: bufferT,
      'token-out': principalT
    }, ), ),
    mode: 'readonly'
  },
  'decode-order-remove-liquidity-from-reveal-tx-or-fail': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'order-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({
      'commit-txid': bufferT,
      'order-details': tupleT({ amount: uintT, 'chain-id': uintT, from: bufferT, 'pool-id': uintT }, )
    }, ), ),
    mode: 'readonly'
  },
  'decode-order-remove-liquidity-or-fail': {
    input: [ { name: 'order-script', type: bufferT } ],
    output: responseSimpleT(tupleT({ amount: uintT, 'chain-id': uintT, from: bufferT, 'pool-id': uintT }, ), ),
    mode: 'readonly'
  },
  'get-fee-to-address': { input: [], output: principalT, mode: 'readonly' },
  'get-pair-details': {
    input: [
      {
        name: 'pair',
        type: tupleT({ 'chain-id': uintT, token: principalT }, )
      }
    ],
    output: optionalT(tupleT({
      approved: booleanT,
      'no-burn': booleanT,
      'peg-in-fee': uintT,
      'peg-in-paused': booleanT,
      'peg-out-fee': uintT,
      'peg-out-gas-fee': uintT,
      'peg-out-paused': booleanT,
      tick: stringT
    }, ), ),
    mode: 'readonly'
  },
  'get-pair-details-many': {
    input: [
      {
        name: 'pairs',
        type: listT(tupleT({ 'chain-id': uintT, token: principalT }, ), )
      }
    ],
    output: listT(optionalT(tupleT({
      approved: booleanT,
      'no-burn': booleanT,
      'peg-in-fee': uintT,
      'peg-in-paused': booleanT,
      'peg-out-fee': uintT,
      'peg-out-gas-fee': uintT,
      'peg-out-paused': booleanT,
      tick: stringT
    }, ), ), ),
    mode: 'readonly'
  },
  'get-pair-details-or-fail': {
    input: [
      {
        name: 'pair',
        type: tupleT({ 'chain-id': uintT, token: principalT }, )
      }
    ],
    output: responseSimpleT(tupleT({
      approved: booleanT,
      'no-burn': booleanT,
      'peg-in-fee': uintT,
      'peg-in-paused': booleanT,
      'peg-out-fee': uintT,
      'peg-out-gas-fee': uintT,
      'peg-out-paused': booleanT,
      tick: stringT
    }, ), ),
    mode: 'readonly'
  },
  'get-peg-in-fee': { input: [], output: uintT, mode: 'readonly' },
  'get-peg-in-sent-or-default': {
    input: [
      { name: 'bitcoin-tx', type: bufferT },
      { name: 'output', type: uintT },
      { name: 'offset', type: uintT }
    ],
    output: booleanT,
    mode: 'readonly'
  },
  'get-tick-to-pair-or-fail': {
    input: [ { name: 'tick', type: stringT } ],
    output: responseSimpleT(tupleT({ 'chain-id': uintT, token: principalT }, ), ),
    mode: 'readonly'
  },
  'is-approved-pair': {
    input: [
      {
        name: 'pair',
        type: tupleT({ 'chain-id': uintT, token: principalT }, )
      }
    ],
    output: booleanT,
    mode: 'readonly'
  },
  'is-dao-or-extension': { input: [], output: responseSimpleT(booleanT, ), mode: 'readonly' },
  'is-paused': { input: [], output: booleanT, mode: 'readonly' },
  'is-peg-in-address-approved': {
    input: [ { name: 'address', type: bufferT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'validate-tx-add-liquidity': {
    input: [
      {
        name: 'commit-tx',
        type: tupleT({ 'fee-idx': optionalT(uintT, ), 'output-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-tx',
        type: tupleT({ 'order-idx': uintT, tx: bufferT }, )
      },
      { name: 'dx-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({
      'amt-net': uintT,
      dx: uintT,
      fee: uintT,
      'order-details': tupleT({
        factor: uintT,
        from: bufferT,
        'max-dy': optionalT(uintT, ),
        token: principalT
      }, ),
      'pair-details': tupleT({ 'chain-id': uintT, token: principalT }, ),
      'token-details': tupleT({
        approved: booleanT,
        'no-burn': booleanT,
        'peg-in-fee': uintT,
        'peg-in-paused': booleanT,
        'peg-out-fee': uintT,
        'peg-out-gas-fee': uintT,
        'peg-out-paused': booleanT,
        tick: stringT
      }, ),
      'tx-idxed': tupleT({ amt: uintT, from: bufferT, tick: stringT, to: bufferT }, )
    }, ), ),
    mode: 'readonly'
  },
  'validate-tx-create-pool': {
    input: [
      {
        name: 'commit-tx',
        type: tupleT({ 'fee-idx': optionalT(uintT, ), 'output-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-tx',
        type: tupleT({ 'order-idx': uintT, tx: bufferT }, )
      },
      { name: 'dx-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({
      'amt-net': uintT,
      dx: uintT,
      fee: uintT,
      'order-details': tupleT({ burn: booleanT, factor: uintT, from: bufferT, token: principalT }, ),
      'pair-details': tupleT({ 'chain-id': uintT, token: principalT }, ),
      'token-details': tupleT({
        approved: booleanT,
        'no-burn': booleanT,
        'peg-in-fee': uintT,
        'peg-in-paused': booleanT,
        'peg-out-fee': uintT,
        'peg-out-gas-fee': uintT,
        'peg-out-paused': booleanT,
        tick: stringT
      }, ),
      'tx-idxed': tupleT({ amt: uintT, from: bufferT, tick: stringT, to: bufferT }, )
    }, ), ),
    mode: 'readonly'
  },
  'validate-tx-cross-swap': {
    input: [
      {
        name: 'commit-tx',
        type: tupleT({ 'fee-idx': optionalT(uintT, ), 'output-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-tx',
        type: tupleT({ 'order-idx': uintT, tx: bufferT }, )
      },
      { name: 'routing-traits', type: listT(traitT, ) },
      { name: 'token-out-trait', type: traitT }
    ],
    output: responseSimpleT(tupleT({
      'amt-net': uintT,
      fee: uintT,
      'order-details': tupleT({
        'chain-id': optionalT(uintT, ),
        from: bufferT,
        'min-amount-out': optionalT(uintT, ),
        routing: listT(uintT, ),
        to: bufferT,
        'token-out': principalT
      }, ),
      'pair-details': tupleT({ 'chain-id': uintT, token: principalT }, ),
      'routing-factors': listT(uintT, ),
      'routing-tokens': listT(principalT, ),
      'token-details': tupleT({
        approved: booleanT,
        'no-burn': booleanT,
        'peg-in-fee': uintT,
        'peg-in-paused': booleanT,
        'peg-out-fee': uintT,
        'peg-out-gas-fee': uintT,
        'peg-out-paused': booleanT,
        tick: stringT
      }, ),
      'tx-idxed': tupleT({ amt: uintT, from: bufferT, tick: stringT, to: bufferT }, )
    }, ), ),
    mode: 'readonly'
  },
  'validate-tx-remove-liquidity': {
    input: [
      {
        name: 'commit-tx',
        type: tupleT({ 'fee-idx': optionalT(uintT, ), tx: bufferT }, )
      },
      {
        name: 'reveal-tx',
        type: tupleT({ 'order-idx': uintT, tx: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({
      fee: uintT,
      'order-details': tupleT({ amount: uintT, 'chain-id': uintT, from: bufferT, 'pool-id': uintT }, ),
      'pool-details': tupleT({ factor: uintT, 'token-x': principalT, 'token-y': principalT }, ),
      'token-details': tupleT({
        approved: booleanT,
        'no-burn': booleanT,
        'peg-in-fee': uintT,
        'peg-in-paused': booleanT,
        'peg-out-fee': uintT,
        'peg-out-gas-fee': uintT,
        'peg-out-paused': booleanT,
        tick: stringT
      }, )
    }, ), ),
    mode: 'readonly'
  },
  'fee-to-address': { input: noneT, output: principalT, mode: 'variable' },
  paused: { input: noneT, output: booleanT, mode: 'variable' },
  'peg-in-fee': { input: noneT, output: uintT, mode: 'variable' },
  'pool-setting': {
    input: noneT,
    output: tupleT({
      'fee-rate-x': uintT,
      'fee-rate-y': uintT,
      'max-in-ratio': uintT,
      'max-out-ratio': uintT,
      memo: optionalT(bufferT, ),
      'oracle-average': uintT,
      'oracle-enabled': booleanT,
      'start-block': uintT,
      'threshold-x': uintT,
      'threshold-y': uintT
    }, ),
    mode: 'variable'
  }
}
} as const)


