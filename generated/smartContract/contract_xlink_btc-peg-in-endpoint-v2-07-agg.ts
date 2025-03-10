
import {
defineContract,
principalT,
bufferT,
responseSimpleT,
booleanT,
tupleT,
uintT,
listT,
traitT,
optionalT,
stringAsciiT,
noneT
} from "../smartContractHelpers/codegenImport"

export const btcPegInEndpointV207Agg = defineContract({
"btc-peg-in-endpoint-v2-07-agg": {
  callback: {
    input: [
      { name: 'sender', type: principalT },
      { name: 'payload', type: bufferT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'finalize-peg-in-agg': {
    input: [
      { name: 'tx', type: bufferT },
      {
        name: 'block',
        type: tupleT({ header: bufferT, height: uintT }, )
      },
      {
        name: 'proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      },
      { name: 'output-idx', type: uintT },
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
      { name: 'swap-token-in-trait', type: traitT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'pause-peg-in': {
    input: [ { name: 'paused', type: booleanT } ],
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
  'set-peg-in-min-fee': {
    input: [ { name: 'fee', type: uintT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'construct-principal': {
    input: [ { name: 'hash-bytes', type: bufferT } ],
    output: responseSimpleT(principalT, ),
    mode: 'readonly'
  },
  'create-order-agg-or-fail': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'chain-id': optionalT(uintT, ),
          'dest-chain-id': uintT,
          from: bufferT,
          'min-amount-out': optionalT(uintT, ),
          'swap-token-in': principalT,
          'swap-token-out': principalT,
          to: bufferT,
          'token-out': principalT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'decode-from-reveal-tx-or-fail': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'order-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({ 'commit-txid': bufferT, 'order-script': bufferT }, ), ),
    mode: 'readonly'
  },
  'decode-order-agg-from-reveal-tx-or-fail': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'order-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({
      'commit-txid': bufferT,
      'order-details': tupleT({
        'chain-id': optionalT(uintT, ),
        'dest-chain-id': uintT,
        from: bufferT,
        'min-amount-out': optionalT(uintT, ),
        'swap-token-in': principalT,
        'swap-token-out': principalT,
        to: bufferT,
        'token-out': principalT
      }, )
    }, ), ),
    mode: 'readonly'
  },
  'decode-order-agg-or-fail': {
    input: [
      { name: 'order-script', type: bufferT },
      { name: 'offset', type: uintT }
    ],
    output: responseSimpleT(tupleT({
      'chain-id': optionalT(uintT, ),
      'dest-chain-id': uintT,
      from: bufferT,
      'min-amount-out': optionalT(uintT, ),
      'swap-token-in': principalT,
      'swap-token-out': principalT,
      to: bufferT,
      'token-out': principalT
    }, ), ),
    mode: 'readonly'
  },
  'destruct-principal': {
    input: [ { name: 'address', type: principalT } ],
    output: responseSimpleT(tupleT({
      'hash-bytes': bufferT,
      name: optionalT(stringAsciiT, ),
      version: bufferT
    }, ), ),
    mode: 'readonly'
  },
  'extract-tx-ins-outs': {
    input: [ { name: 'tx', type: bufferT } ],
    output: responseSimpleT(tupleT({
      ins: listT(tupleT({
        outpoint: tupleT({ hash: bufferT, index: uintT }, ),
        scriptSig: bufferT,
        sequence: uintT
      }, ), ),
      outs: listT(tupleT({ scriptPubKey: bufferT, value: uintT }, ), )
    }, ), ),
    mode: 'readonly'
  },
  'get-fee-to-address': { input: [], output: principalT, mode: 'readonly' },
  'get-peg-in-fee': { input: [], output: uintT, mode: 'readonly' },
  'get-peg-in-min-fee': { input: [], output: uintT, mode: 'readonly' },
  'get-peg-in-sent-or-default': {
    input: [ { name: 'tx', type: bufferT }, { name: 'output', type: uintT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'get-txid': {
    input: [ { name: 'tx', type: bufferT } ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'is-dao-or-extension': { input: [], output: responseSimpleT(booleanT, ), mode: 'readonly' },
  'is-peg-in-address-approved': {
    input: [ { name: 'address', type: bufferT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'is-peg-in-paused': { input: [], output: booleanT, mode: 'readonly' },
  'validate-tx-agg': {
    input: [
      {
        name: 'commit-tx',
        type: tupleT({ 'output-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-tx',
        type: tupleT({ 'order-idx': uintT, tx: bufferT }, )
      }
    ],
    output: responseSimpleT(tupleT({
      'amount-in-fixed': uintT,
      'dest-chain-id': uintT,
      'fail-settle': tupleT({ address: bufferT, 'chain-id': optionalT(uintT, ), token: principalT }, ),
      'min-amount-out': optionalT(uintT, ),
      'success-settle': tupleT({ address: bufferT, 'chain-id': optionalT(uintT, ), token: principalT }, ),
      'token-in': principalT,
      'token-out': principalT
    }, ), ),
    mode: 'readonly'
  },
  'verify-mined': {
    input: [
      { name: 'tx', type: bufferT },
      {
        name: 'block',
        type: tupleT({ header: bufferT, height: uintT }, )
      },
      {
        name: 'proof',
        type: tupleT({ hashes: listT(bufferT, ), 'tree-depth': uintT, 'tx-index': uintT }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'readonly'
  },
  'fee-to-address': { input: noneT, output: principalT, mode: 'variable' },
  'peg-in-fee': { input: noneT, output: uintT, mode: 'variable' },
  'peg-in-min-fee': { input: noneT, output: uintT, mode: 'variable' },
  'peg-in-paused': { input: noneT, output: booleanT, mode: 'variable' }
}
} as const)


