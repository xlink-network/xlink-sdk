
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

export const btcPegInEndpointV203 = defineContract({
"btc-peg-in-endpoint-v2-03": {
  callback: {
    input: [
      { name: 'sender', type: principalT },
      { name: 'payload', type: bufferT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'finalize-peg-in-0': {
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
      { name: 'order-idx', type: uintT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'finalize-peg-in-cross': {
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
      { name: 'token-trait', type: traitT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'finalize-peg-in-cross-swap': {
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
      { name: 'routing-traits', type: listT(traitT, ) }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'finalize-peg-in-launchpad': {
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
      { name: 'order-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({ end: uintT, start: uintT }, ), ),
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
  'break-routing-id': {
    input: [ { name: 'routing-ids', type: listT(uintT, ) } ],
    output: responseSimpleT(tupleT({
      'routing-factors': listT(uintT, ),
      'routing-tokens': listT(principalT, )
    }, ), ),
    mode: 'readonly'
  },
  'construct-principal': {
    input: [ { name: 'hash-bytes', type: bufferT } ],
    output: responseSimpleT(principalT, ),
    mode: 'readonly'
  },
  'create-order-0-or-fail': {
    input: [ { name: 'order', type: principalT } ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'create-order-cross-or-fail': {
    input: [
      {
        name: 'order',
        type: tupleT({ 'chain-id': uintT, from: bufferT, to: bufferT, token: principalT }, )
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
          to: bufferT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'create-order-launchpad-or-fail': {
    input: [
      {
        name: 'order',
        type: tupleT({ dest: bufferT, 'launch-id': uintT, user: bufferT }, )
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
  'decode-order-0-or-fail': {
    input: [ { name: 'order-script', type: bufferT } ],
    output: responseSimpleT(principalT, ),
    mode: 'readonly'
  },
  'decode-order-cross-from-reveal-tx-or-fail': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'order-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({
      'commit-txid': bufferT,
      'order-details': tupleT({ 'chain-id': uintT, from: bufferT, to: bufferT, token: principalT }, )
    }, ), ),
    mode: 'readonly'
  },
  'decode-order-cross-or-fail': {
    input: [ { name: 'order-script', type: bufferT } ],
    output: responseSimpleT(tupleT({ 'chain-id': uintT, from: bufferT, to: bufferT, token: principalT }, ), ),
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
        to: bufferT
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
      to: bufferT
    }, ), ),
    mode: 'readonly'
  },
  'decode-order-launchpad-or-fail': {
    input: [
      { name: 'order-script', type: bufferT },
      { name: 'offset', type: uintT }
    ],
    output: responseSimpleT(tupleT({ dest: bufferT, 'launch-id': uintT, user: bufferT }, ), ),
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
  'get-approved-wrapped-or-default': {
    input: [ { name: 'token', type: principalT } ],
    output: booleanT,
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
  'validate-tx-0': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'output-idx', type: uintT },
      { name: 'order-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({ 'amount-net': uintT, fee: uintT, 'order-details': principalT }, ), ),
    mode: 'readonly'
  },
  'validate-tx-cross': {
    input: [
      {
        name: 'commit-tx',
        type: tupleT({ 'output-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-tx',
        type: tupleT({ 'order-idx': uintT, tx: bufferT }, )
      },
      { name: 'token-trait', type: traitT }
    ],
    output: responseSimpleT(tupleT({
      'amount-net': uintT,
      fee: uintT,
      'order-details': tupleT({ 'chain-id': uintT, from: bufferT, to: bufferT, token: principalT }, )
    }, ), ),
    mode: 'readonly'
  },
  'validate-tx-cross-swap': {
    input: [
      {
        name: 'commit-tx',
        type: tupleT({ 'output-idx': uintT, tx: bufferT }, )
      },
      {
        name: 'reveal-tx',
        type: tupleT({ 'order-idx': uintT, tx: bufferT }, )
      },
      { name: 'routing-traits', type: listT(traitT, ) }
    ],
    output: responseSimpleT(tupleT({
      'amount-net': uintT,
      fee: uintT,
      'order-details': tupleT({
        'chain-id': optionalT(uintT, ),
        from: bufferT,
        'min-amount-out': optionalT(uintT, ),
        routing: listT(uintT, ),
        to: bufferT
      }, ),
      'routing-factors': listT(uintT, ),
      'routing-tokens': listT(principalT, )
    }, ), ),
    mode: 'readonly'
  },
  'validate-tx-launchpad': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'output-idx', type: uintT },
      { name: 'order-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({
      'amount-net': uintT,
      fee: uintT,
      'order-details': tupleT({ dest: bufferT, 'launch-id': uintT, user: bufferT }, )
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


