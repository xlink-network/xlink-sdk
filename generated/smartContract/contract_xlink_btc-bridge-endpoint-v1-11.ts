
import {
defineContract,
uintT,
bufferT,
responseSimpleT,
booleanT,
tupleT,
listT,
traitT,
optionalT,
principalT,
noneT
} from "../smartContractHelpers/codegenImport"

export const btcBridgeEndpointV111 = defineContract({
"btc-bridge-endpoint-v1-11": {
  'claim-peg-out': {
    input: [
      { name: 'request-id', type: uintT },
      { name: 'fulfilled-by', type: bufferT }
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
  'finalize-peg-in-1': {
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
      { name: 'order-idx', type: uintT },
      { name: 'token-trait', type: traitT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'finalize-peg-in-2': {
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
      { name: 'order-idx', type: uintT },
      { name: 'token1-trait', type: traitT },
      { name: 'token2-trait', type: traitT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'finalize-peg-in-3': {
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
      { name: 'order-idx', type: uintT },
      { name: 'token1-trait', type: traitT },
      { name: 'token2-trait', type: traitT },
      { name: 'token3-trait', type: traitT }
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
      { name: 'order-idx', type: uintT },
      { name: 'owner-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({ end: uintT, start: uintT }, ), ),
    mode: 'public'
  },
  'finalize-peg-out': {
    input: [
      { name: 'request-id', type: uintT },
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
      { name: 'fulfilled-by-idx', type: uintT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'pause-peg-in': {
    input: [ { name: 'paused', type: booleanT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'pause-peg-out': {
    input: [ { name: 'paused', type: booleanT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'request-peg-out-0': {
    input: [
      { name: 'peg-out-address', type: bufferT },
      { name: 'amount', type: uintT }
    ],
    output: responseSimpleT(uintT, ),
    mode: 'public'
  },
  'request-peg-out-1': {
    input: [
      { name: 'peg-out-address', type: bufferT },
      { name: 'token-trait', type: traitT },
      { name: 'factor', type: uintT },
      { name: 'dx', type: uintT },
      { name: 'min-dy', type: optionalT(uintT, ) }
    ],
    output: responseSimpleT(uintT, ),
    mode: 'public'
  },
  'request-peg-out-2': {
    input: [
      { name: 'peg-out-address', type: bufferT },
      { name: 'token1-trait', type: traitT },
      { name: 'token2-trait', type: traitT },
      { name: 'factor1', type: uintT },
      { name: 'factor2', type: uintT },
      { name: 'dx', type: uintT },
      { name: 'min-dz', type: optionalT(uintT, ) }
    ],
    output: responseSimpleT(uintT, ),
    mode: 'public'
  },
  'request-peg-out-3': {
    input: [
      { name: 'peg-out-address', type: bufferT },
      { name: 'token1-trait', type: traitT },
      { name: 'token2-trait', type: traitT },
      { name: 'token3-trait', type: traitT },
      { name: 'factor1', type: uintT },
      { name: 'factor2', type: uintT },
      { name: 'factor3', type: uintT },
      { name: 'dx', type: uintT },
      { name: 'min-dw', type: optionalT(uintT, ) }
    ],
    output: responseSimpleT(uintT, ),
    mode: 'public'
  },
  'revoke-peg-out': {
    input: [ { name: 'request-id', type: uintT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-contract-owner': {
    input: [ { name: 'new-contract-owner', type: principalT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-fee-address': {
    input: [ { name: 'new-fee-address', type: principalT } ],
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
  'set-peg-out-fee': {
    input: [ { name: 'fee', type: uintT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-peg-out-min-fee': {
    input: [ { name: 'fee', type: uintT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-use-whitelist': {
    input: [
      { name: 'launch-id', type: uintT },
      { name: 'new-whitelisted', type: booleanT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-whitelisted': {
    input: [
      { name: 'launch-id', type: uintT },
      {
        name: 'whitelisted-users',
        type: listT(tupleT({ owner: bufferT, whitelisted: booleanT }, ), )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'create-order-0-or-fail': {
    input: [ { name: 'order', type: principalT } ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'create-order-1-or-fail': {
    input: [
      {
        name: 'order',
        type: tupleT({ 'min-dy': uintT, 'pool-id': uintT, user: principalT }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'create-order-2-or-fail': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'min-dz': uintT,
          'pool1-id': uintT,
          'pool2-id': uintT,
          user: principalT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'create-order-3-or-fail': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'min-dw': uintT,
          'pool1-id': uintT,
          'pool2-id': uintT,
          'pool3-id': uintT,
          user: principalT
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
        type: tupleT({ 'launch-id': uintT, user: principalT }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'decode-order-0-or-fail': {
    input: [ { name: 'order-script', type: bufferT } ],
    output: responseSimpleT(principalT, ),
    mode: 'readonly'
  },
  'decode-order-1-or-fail': {
    input: [ { name: 'order-script', type: bufferT } ],
    output: responseSimpleT(tupleT({ 'min-dy': uintT, 'pool-id': uintT, user: principalT }, ), ),
    mode: 'readonly'
  },
  'decode-order-2-or-fail': {
    input: [ { name: 'order-script', type: bufferT } ],
    output: responseSimpleT(tupleT({
      'min-dz': uintT,
      'pool1-id': uintT,
      'pool2-id': uintT,
      user: principalT
    }, ), ),
    mode: 'readonly'
  },
  'decode-order-3-or-fail': {
    input: [ { name: 'order-script', type: bufferT } ],
    output: responseSimpleT(tupleT({
      'min-dw': uintT,
      'pool1-id': uintT,
      'pool2-id': uintT,
      'pool3-id': uintT,
      user: principalT
    }, ), ),
    mode: 'readonly'
  },
  'decode-order-launchpad-or-fail': {
    input: [ { name: 'order-script', type: bufferT } ],
    output: responseSimpleT(tupleT({ 'launch-id': uintT, user: principalT }, ), ),
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
  'get-fee-address': { input: [], output: principalT, mode: 'readonly' },
  'get-peg-in-fee': { input: [], output: uintT, mode: 'readonly' },
  'get-peg-in-min-fee': { input: [], output: uintT, mode: 'readonly' },
  'get-peg-in-sent-or-default': {
    input: [ { name: 'tx', type: bufferT }, { name: 'output', type: uintT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'get-peg-out-fee': { input: [], output: uintT, mode: 'readonly' },
  'get-peg-out-min-fee': { input: [], output: uintT, mode: 'readonly' },
  'get-request-claim-grace-period': { input: [], output: uintT, mode: 'readonly' },
  'get-request-or-fail': {
    input: [ { name: 'request-id', type: uintT } ],
    output: responseSimpleT(tupleT({
      'amount-net': uintT,
      claimed: uintT,
      'claimed-by': principalT,
      fee: uintT,
      finalized: booleanT,
      'fulfilled-by': bufferT,
      'gas-fee': uintT,
      'peg-out-address': bufferT,
      'requested-at': uintT,
      'requested-at-burn-height': uintT,
      'requested-by': principalT,
      revoked: booleanT
    }, ), ),
    mode: 'readonly'
  },
  'get-request-revoke-grace-period': { input: [], output: uintT, mode: 'readonly' },
  'get-txid': {
    input: [ { name: 'tx', type: bufferT } ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'get-use-whitelist-or-default': {
    input: [ { name: 'launch-id', type: uintT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'get-whitelisted-or-default': {
    input: [
      { name: 'launch-id', type: uintT },
      { name: 'owner', type: bufferT }
    ],
    output: booleanT,
    mode: 'readonly'
  },
  'is-peg-in-address-approved': {
    input: [ { name: 'address', type: bufferT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'is-peg-in-paused': { input: [], output: booleanT, mode: 'readonly' },
  'is-peg-out-paused': { input: [], output: booleanT, mode: 'readonly' },
  'validate-tx-0': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'output-idx', type: uintT },
      { name: 'order-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({ 'amount-net': uintT, fee: uintT, 'order-details': principalT }, ), ),
    mode: 'readonly'
  },
  'validate-tx-1': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'output-idx', type: uintT },
      { name: 'order-idx', type: uintT },
      { name: 'token', type: principalT }
    ],
    output: responseSimpleT(tupleT({
      factor: uintT,
      'token-y': principalT,
      'validation-data': tupleT({
        'amount-net': uintT,
        fee: uintT,
        'order-details': tupleT({ 'min-dy': uintT, 'pool-id': uintT, user: principalT }, )
      }, )
    }, ), ),
    mode: 'readonly'
  },
  'validate-tx-2': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'output-idx', type: uintT },
      { name: 'order-idx', type: uintT },
      { name: 'token1', type: principalT },
      { name: 'token2', type: principalT }
    ],
    output: responseSimpleT(tupleT({
      factor1: uintT,
      factor2: uintT,
      'token1-y': principalT,
      'token2-y': principalT,
      'validation-data': tupleT({
        'amount-net': uintT,
        fee: uintT,
        'order-details': tupleT({
          'min-dz': uintT,
          'pool1-id': uintT,
          'pool2-id': uintT,
          user: principalT
        }, )
      }, )
    }, ), ),
    mode: 'readonly'
  },
  'validate-tx-3': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'output-idx', type: uintT },
      { name: 'order-idx', type: uintT },
      { name: 'token1', type: principalT },
      { name: 'token2', type: principalT },
      { name: 'token3', type: principalT }
    ],
    output: responseSimpleT(tupleT({
      factor1: uintT,
      factor2: uintT,
      factor3: uintT,
      'token1-y': principalT,
      'token2-y': principalT,
      'token3-y': principalT,
      'validation-data': tupleT({
        'amount-net': uintT,
        fee: uintT,
        'order-details': tupleT({
          'min-dw': uintT,
          'pool1-id': uintT,
          'pool2-id': uintT,
          'pool3-id': uintT,
          user: principalT
        }, )
      }, )
    }, ), ),
    mode: 'readonly'
  },
  'validate-tx-launchpad': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'output-idx', type: uintT },
      { name: 'order-idx', type: uintT },
      { name: 'owner-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({
      'amount-net': uintT,
      fee: uintT,
      'order-details': tupleT({ 'launch-id': uintT, user: principalT }, ),
      'owner-script': bufferT
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
  'use-whitelist': { input: uintT, output: optionalT(booleanT, ), mode: 'mapEntry' },
  whitelisted: {
    input: tupleT({ 'launch-id': uintT, owner: bufferT }, ),
    output: optionalT(booleanT, ),
    mode: 'mapEntry'
  },
  'contract-owner': { input: noneT, output: principalT, mode: 'variable' },
  'fee-address': { input: noneT, output: principalT, mode: 'variable' },
  'peg-in-fee': { input: noneT, output: uintT, mode: 'variable' },
  'peg-in-min-fee': { input: noneT, output: uintT, mode: 'variable' },
  'peg-in-paused': { input: noneT, output: booleanT, mode: 'variable' },
  'peg-out-fee': { input: noneT, output: uintT, mode: 'variable' },
  'peg-out-min-fee': { input: noneT, output: uintT, mode: 'variable' },
  'peg-out-paused': { input: noneT, output: booleanT, mode: 'variable' }
}
} as const)


