
import {
defineContract,
booleanT,
responseSimpleT,
tupleT,
uintT,
optionalT,
bufferT,
listT,
principalT,
traitT,
stringT,
noneT
} from "../smartContractHelpers/codegenImport"

export const crossPegInEndpointV204Swap = defineContract({
"cross-peg-in-endpoint-v2-04-swap": {
  'apply-whitelist': {
    input: [ { name: 'new-use-whitelist', type: booleanT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-paused': {
    input: [ { name: 'paused', type: booleanT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'transfer-to-cross-swap': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'amount-in-fixed': uintT,
          'dest-chain-id': optionalT(uintT, ),
          from: bufferT,
          'min-amount-out-fixed': optionalT(uintT, ),
          'routing-factors': listT(uintT, ),
          'routing-tokens': listT(principalT, ),
          salt: bufferT,
          'src-chain-id': uintT,
          to: bufferT,
          'token-in': principalT,
          'token-out': principalT
        }, )
      },
      { name: 'token-in-trait', type: traitT },
      { name: 'routing-traits', type: listT(traitT, ) },
      { name: 'token-out-trait', type: traitT },
      {
        name: 'signature-packs',
        type: listT(tupleT({ 'order-hash': bufferT, signature: bufferT, signer: principalT }, ), )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  whitelist: {
    input: [
      { name: 'user', type: principalT },
      { name: 'whitelisted', type: booleanT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'whitelist-many': {
    input: [
      { name: 'users', type: listT(principalT, ) },
      { name: 'whitelisted', type: listT(booleanT, ) }
    ],
    output: responseSimpleT(listT(responseSimpleT(booleanT, ), ), ),
    mode: 'public'
  },
  'create-cross-swap-order': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'amount-in-fixed': uintT,
          'dest-chain-id': optionalT(uintT, ),
          from: bufferT,
          'min-amount-out-fixed': optionalT(uintT, ),
          'routing-factors': listT(uintT, ),
          'routing-tokens': listT(principalT, ),
          salt: bufferT,
          'src-chain-id': uintT,
          to: bufferT,
          'token-in': principalT,
          'token-out': principalT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'decode-cross-swap-order': {
    input: [ { name: 'order-buff', type: bufferT } ],
    output: responseSimpleT(tupleT({
      'amount-in-fixed': uintT,
      'dest-chain-id': optionalT(uintT, ),
      from: bufferT,
      'min-amount-out-fixed': optionalT(uintT, ),
      'routing-factors': listT(uintT, ),
      'routing-tokens': listT(principalT, ),
      salt: bufferT,
      'src-chain-id': uintT,
      to: bufferT,
      'token-in': principalT,
      'token-out': principalT
    }, ), ),
    mode: 'readonly'
  },
  'get-approved-chain-or-fail': {
    input: [ { name: 'src-chain-id', type: uintT } ],
    output: responseSimpleT(tupleT({ 'buff-length': uintT, name: stringT }, ), ),
    mode: 'readonly'
  },
  'get-approved-pair-or-fail': {
    input: [
      {
        name: 'pair',
        type: tupleT({ 'chain-id': uintT, token: principalT }, )
      }
    ],
    output: responseSimpleT(tupleT({
      approved: booleanT,
      burnable: booleanT,
      fee: uintT,
      'max-amount': uintT,
      'min-amount': uintT,
      'min-fee': uintT,
      reserve: uintT
    }, ), ),
    mode: 'readonly'
  },
  'get-default-peg-out-fee': {
    input: [
      {
        name: 'pair-tuple',
        type: tupleT({ 'chain-id': optionalT(uintT, ), token: principalT }, )
      }
    ],
    output: responseSimpleT(tupleT({ 'peg-out-fee': uintT, 'peg-out-gas-fee': uintT }, ), ),
    mode: 'readonly'
  },
  'get-min-fee-or-default': {
    input: [
      {
        name: 'pair',
        type: tupleT({ 'chain-id': uintT, token: principalT }, )
      }
    ],
    output: uintT,
    mode: 'readonly'
  },
  'get-paused': { input: [], output: booleanT, mode: 'readonly' },
  'get-required-validators': { input: [], output: uintT, mode: 'readonly' },
  'get-token-reserve-or-default': {
    input: [
      {
        name: 'pair',
        type: tupleT({ 'chain-id': uintT, token: principalT }, )
      }
    ],
    output: uintT,
    mode: 'readonly'
  },
  'get-use-whitelist': { input: [], output: booleanT, mode: 'readonly' },
  'get-validator-or-fail': {
    input: [ { name: 'validator', type: principalT } ],
    output: responseSimpleT(tupleT({ 'chain-id': uintT, pubkey: bufferT }, ), ),
    mode: 'readonly'
  },
  'hash-cross-swap-order': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'amount-in-fixed': uintT,
          'dest-chain-id': optionalT(uintT, ),
          from: bufferT,
          'min-amount-out-fixed': optionalT(uintT, ),
          'routing-factors': listT(uintT, ),
          'routing-tokens': listT(principalT, ),
          salt: bufferT,
          'src-chain-id': uintT,
          to: bufferT,
          'token-in': principalT,
          'token-out': principalT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'is-approved-relayer-or-default': {
    input: [ { name: 'relayer', type: principalT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'is-dao-or-extension': { input: [], output: responseSimpleT(booleanT, ), mode: 'readonly' },
  'is-order-sent-or-default': {
    input: [ { name: 'order-hash', type: bufferT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'is-order-validated-by-or-default': {
    input: [
      { name: 'order-hash', type: bufferT },
      { name: 'validator', type: principalT }
    ],
    output: booleanT,
    mode: 'readonly'
  },
  'is-whitelisted': {
    input: [ { name: 'user', type: principalT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'message-domain': { input: [], output: bufferT, mode: 'readonly' },
  'validate-cross-swap-order': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'amount-in-fixed': uintT,
          'dest-chain-id': optionalT(uintT, ),
          from: bufferT,
          'min-amount-out-fixed': optionalT(uintT, ),
          'routing-factors': listT(uintT, ),
          'routing-tokens': listT(principalT, ),
          salt: bufferT,
          'src-chain-id': uintT,
          to: bufferT,
          'token-in': principalT,
          'token-out': principalT
        }, )
      },
      { name: 'token-in-trait', type: traitT },
      { name: 'routing-traits', type: listT(traitT, ) },
      { name: 'token-out-trait', type: traitT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'readonly'
  },
  'whitelisted-users': {
    input: principalT,
    output: optionalT(booleanT, ),
    mode: 'mapEntry'
  },
  'is-paused': { input: noneT, output: booleanT, mode: 'variable' },
  'use-whitelist': { input: noneT, output: booleanT, mode: 'variable' }
}
} as const)


