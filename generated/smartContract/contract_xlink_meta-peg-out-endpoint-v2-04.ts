
import {
defineContract,
uintT,
bufferT,
responseSimpleT,
booleanT,
traitT,
tupleT,
stringT,
listT,
principalT,
optionalT,
noneT
} from "../smartContractHelpers/codegenImport"

export const metaPegOutEndpointV204 = defineContract({
"meta-peg-out-endpoint-v2-04": {
  'claim-peg-out': {
    input: [
      { name: 'request-id', type: uintT },
      { name: 'fulfilled-by', type: bufferT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'finalize-peg-out': {
    input: [
      { name: 'request-id', type: uintT },
      { name: 'tx', type: bufferT },
      { name: 'output-idx', type: uintT },
      { name: 'offset-idx', type: uintT },
      { name: 'token-trait', type: traitT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'finalize-peg-out-on-index': {
    input: [
      { name: 'request-id', type: uintT },
      {
        name: 'tx',
        type: tupleT({
          amt: uintT,
          'bitcoin-tx': bufferT,
          decimals: uintT,
          from: bufferT,
          'from-bal': uintT,
          offset: uintT,
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
  'request-peg-out': {
    input: [
      { name: 'amount', type: uintT },
      { name: 'peg-out-address', type: bufferT },
      { name: 'token-trait', type: traitT },
      { name: 'the-chain-id', type: uintT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'revoke-peg-out': {
    input: [
      { name: 'request-id', type: uintT },
      { name: 'token-trait', type: traitT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-fee-to-address': {
    input: [ { name: 'new-fee-to-address', type: principalT } ],
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
  'get-peg-in-sent-or-default': {
    input: [
      { name: 'bitcoin-tx', type: bufferT },
      { name: 'output', type: uintT },
      { name: 'offset', type: uintT }
    ],
    output: booleanT,
    mode: 'readonly'
  },
  'get-request': {
    input: [ { name: 'request-id', type: uintT } ],
    output: optionalT(tupleT({
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
      revoked: booleanT,
      tick: stringT,
      token: principalT
    }, ), ),
    mode: 'readonly'
  },
  'get-request-claim-grace-period': { input: [], output: uintT, mode: 'readonly' },
  'get-request-many': {
    input: [ { name: 'request-ids', type: listT(uintT, ) } ],
    output: listT(optionalT(tupleT({
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
      revoked: booleanT,
      tick: stringT,
      token: principalT
    }, ), ), ),
    mode: 'readonly'
  },
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
      revoked: booleanT,
      tick: stringT,
      token: principalT
    }, ), ),
    mode: 'readonly'
  },
  'get-request-revoke-grace-period': { input: [], output: uintT, mode: 'readonly' },
  'get-tick-to-pair-or-fail': {
    input: [ { name: 'tick', type: stringT } ],
    output: responseSimpleT(tupleT({ 'chain-id': uintT, token: principalT }, ), ),
    mode: 'readonly'
  },
  'is-dao-or-extension': { input: [], output: responseSimpleT(booleanT, ), mode: 'readonly' },
  'is-fulfill-address-approved': {
    input: [ { name: 'address', type: bufferT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'is-paused': { input: [], output: booleanT, mode: 'readonly' },
  'is-peg-in-address-approved': {
    input: [ { name: 'address', type: bufferT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'validate-peg-out': {
    input: [
      { name: 'amount', type: uintT },
      {
        name: 'pair',
        type: tupleT({ 'chain-id': uintT, token: principalT }, )
      }
    ],
    output: responseSimpleT(tupleT({
      fee: uintT,
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
  paused: { input: noneT, output: booleanT, mode: 'variable' }
}
} as const)


