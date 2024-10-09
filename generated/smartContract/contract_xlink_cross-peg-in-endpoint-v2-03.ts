
import {
defineContract,
booleanT,
responseSimpleT,
principalT,
bufferT,
tupleT,
uintT,
optionalT,
traitT,
listT,
stringT,
noneT
} from "../smartContractHelpers/codegenImport"

export const crossPegInEndpointV203 = defineContract({
"cross-peg-in-endpoint-v2-03": {
  'apply-whitelist': {
    input: [ { name: 'new-use-whitelist', type: booleanT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  callback: {
    input: [
      { name: 'sender', type: principalT },
      { name: 'payload', type: bufferT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  execute: {
    input: [ { name: 'sender', type: principalT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-paused': {
    input: [ { name: 'paused', type: booleanT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'transfer-to-cross': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'amount-in-fixed': uintT,
          'dest-chain-id': optionalT(uintT, ),
          from: bufferT,
          salt: bufferT,
          'src-chain-id': uintT,
          to: bufferT,
          token: principalT
        }, )
      },
      { name: 'token-trait', type: traitT },
      {
        name: 'signature-packs',
        type: listT(tupleT({ 'order-hash': bufferT, signature: bufferT, signer: principalT }, ), )
      }
    ],
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
          to: bufferT
        }, )
      },
      { name: 'routing-traits', type: listT(traitT, ) },
      {
        name: 'signature-packs',
        type: listT(tupleT({ 'order-hash': bufferT, signature: bufferT, signer: principalT }, ), )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'transfer-to-launchpad': {
    input: [
      {
        name: 'order',
        type: tupleT({
          address: bufferT,
          'amount-in-fixed': uintT,
          'chain-id': uintT,
          dest: bufferT,
          'launch-id': uintT,
          salt: bufferT,
          token: principalT
        }, )
      },
      { name: 'token-trait', type: traitT },
      {
        name: 'signature-packs',
        type: listT(tupleT({ 'order-hash': bufferT, signature: bufferT, signer: principalT }, ), )
      }
    ],
    output: responseSimpleT(tupleT({ end: uintT, start: uintT }, ), ),
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
  'create-cross-order': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'amount-in-fixed': uintT,
          'dest-chain-id': optionalT(uintT, ),
          from: bufferT,
          salt: bufferT,
          'src-chain-id': uintT,
          to: bufferT,
          token: principalT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
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
          to: bufferT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'create-launchpad-order': {
    input: [
      {
        name: 'order',
        type: tupleT({
          address: bufferT,
          'amount-in-fixed': uintT,
          'chain-id': uintT,
          dest: bufferT,
          'launch-id': uintT,
          salt: bufferT,
          token: principalT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'decode-cross-order': {
    input: [ { name: 'order-buff', type: bufferT } ],
    output: responseSimpleT(tupleT({
      'amount-in-fixed': uintT,
      'dest-chain-id': optionalT(uintT, ),
      from: bufferT,
      salt: bufferT,
      'src-chain-id': uintT,
      to: bufferT,
      token: principalT
    }, ), ),
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
      to: bufferT
    }, ), ),
    mode: 'readonly'
  },
  'decode-launchpad-order': {
    input: [ { name: 'order-buff', type: bufferT } ],
    output: responseSimpleT(tupleT({
      address: bufferT,
      'amount-in-fixed': uintT,
      'chain-id': uintT,
      dest: bufferT,
      'launch-id': uintT,
      salt: bufferT,
      token: principalT
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
  'hash-cross-order': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'amount-in-fixed': uintT,
          'dest-chain-id': optionalT(uintT, ),
          from: bufferT,
          salt: bufferT,
          'src-chain-id': uintT,
          to: bufferT,
          token: principalT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
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
          to: bufferT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'hash-launchpad-order': {
    input: [
      {
        name: 'order',
        type: tupleT({
          address: bufferT,
          'amount-in-fixed': uintT,
          'chain-id': uintT,
          dest: bufferT,
          'launch-id': uintT,
          salt: bufferT,
          token: principalT
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
  'validate-cross-order': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'amount-in-fixed': uintT,
          'dest-chain-id': optionalT(uintT, ),
          from: bufferT,
          salt: bufferT,
          'src-chain-id': uintT,
          to: bufferT,
          token: principalT
        }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'readonly'
  },
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
          to: bufferT
        }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'readonly'
  },
  'validate-launchpad-order': {
    input: [
      {
        name: 'order',
        type: tupleT({
          address: bufferT,
          'amount-in-fixed': uintT,
          'chain-id': uintT,
          dest: bufferT,
          'launch-id': uintT,
          salt: bufferT,
          token: principalT
        }, )
      }
    ],
    output: responseSimpleT(tupleT({
      'apower-to-burn': uintT,
      offering: tupleT({
        'activation-threshold': uintT,
        'apower-per-ticket-in-fixed': listT(tupleT({ 'apower-per-ticket-in-fixed': uintT, 'tier-threshold': uintT }, ), ),
        'claim-end-height': uintT,
        'fee-per-ticket-in-fixed': uintT,
        'launch-owner': tupleT({ address: bufferT, 'chain-id': optionalT(uintT, ) }, ),
        'launch-token': principalT,
        'launch-tokens-per-ticket': uintT,
        'max-size-factor': uintT,
        memo: optionalT(bufferT, ),
        'payment-token': principalT,
        'price-per-ticket-in-fixed': uintT,
        'registration-end-height': uintT,
        'registration-max-tickets': uintT,
        'registration-start-height': uintT,
        'total-registration-max': uintT,
        'total-tickets': uintT
      }, ),
      tickets: uintT
    }, ), ),
    mode: 'readonly'
  },
  'whitelisted-users': {
    input: principalT,
    output: optionalT(booleanT, ),
    mode: 'mapEntry'
  },
  'is-paused': { input: noneT, output: booleanT, mode: 'variable' },
  'order-hash-to-iter': { input: noneT, output: bufferT, mode: 'variable' },
  'src-chain-id-to-iter': { input: noneT, output: uintT, mode: 'variable' },
  'use-whitelist': { input: noneT, output: booleanT, mode: 'variable' }
}
} as const)


