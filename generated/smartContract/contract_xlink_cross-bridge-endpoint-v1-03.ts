
import {
defineContract,
booleanT,
responseSimpleT,
principalT,
uintT,
listT,
tupleT,
bufferT,
traitT,
stringT,
optionalT,
noneT
} from "../smartContractHelpers/codegenImport"

export const crossBridgeEndpointV103 = defineContract({
"cross-bridge-endpoint-v1-03": {
  'apply-whitelist': {
    input: [ { name: 'new-use-whitelist', type: booleanT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'register-user': {
    input: [ { name: 'user', type: principalT } ],
    output: responseSimpleT(uintT, ),
    mode: 'public'
  },
  'register-user-many': {
    input: [ { name: 'users', type: listT(principalT, ) } ],
    output: responseSimpleT(listT(responseSimpleT(uintT, ), ), ),
    mode: 'public'
  },
  'set-contract-owner': {
    input: [ { name: 'owner', type: principalT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-launch-whitelisted': {
    input: [
      { name: 'launch-id', type: uintT },
      {
        name: 'whitelisted',
        type: listT(tupleT({ owner: bufferT, whitelisted: booleanT }, ), )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-paused': {
    input: [ { name: 'paused', type: booleanT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-use-launch-whitelist': {
    input: [
      { name: 'launch-id', type: uintT },
      { name: 'new-whitelisted', type: booleanT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'transfer-to-launchpad': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'amount-in-fixed': uintT,
          'chain-id': uintT,
          from: bufferT,
          'launch-id': uintT,
          salt: bufferT,
          to: uintT,
          token: uintT
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
  'transfer-to-unwrap': {
    input: [
      { name: 'token-trait', type: traitT },
      { name: 'amount-in-fixed', type: uintT },
      { name: 'the-chain-id', type: uintT },
      { name: 'settle-address', type: bufferT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'transfer-to-wrap': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'amount-in-fixed': uintT,
          'chain-id': uintT,
          salt: bufferT,
          to: uintT,
          token: uintT
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
  'check-is-approved-token': {
    input: [ { name: 'token', type: principalT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'readonly'
  },
  'create-launchpad-order': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'amount-in-fixed': uintT,
          'chain-id': uintT,
          from: bufferT,
          'launch-id': uintT,
          salt: bufferT,
          to: uintT,
          token: uintT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'create-wrap-order': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'amount-in-fixed': uintT,
          'chain-id': uintT,
          salt: bufferT,
          to: uintT,
          token: uintT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'decode-launchpad-order': {
    input: [ { name: 'order-buff', type: bufferT } ],
    output: responseSimpleT(tupleT({
      'amount-in-fixed': uintT,
      'chain-id': uintT,
      from: bufferT,
      'launch-id': uintT,
      salt: bufferT,
      to: uintT,
      token: uintT
    }, ), ),
    mode: 'readonly'
  },
  'decode-wrap-order': {
    input: [ { name: 'order-buff', type: bufferT } ],
    output: responseSimpleT(tupleT({
      'amount-in-fixed': uintT,
      'chain-id': uintT,
      salt: bufferT,
      to: uintT,
      token: uintT
    }, ), ),
    mode: 'readonly'
  },
  'get-approved-chain-or-fail': {
    input: [ { name: 'the-chain-id', type: uintT } ],
    output: responseSimpleT(tupleT({ 'buff-length': uintT, name: stringT }, ), ),
    mode: 'readonly'
  },
  'get-approved-token-by-id-or-fail': {
    input: [ { name: 'token-id', type: uintT } ],
    output: responseSimpleT(tupleT({
      'accrued-fee': uintT,
      approved: booleanT,
      burnable: booleanT,
      fee: uintT,
      'max-amount': uintT,
      'min-amount': uintT,
      token: principalT
    }, ), ),
    mode: 'readonly'
  },
  'get-approved-token-id-or-fail': {
    input: [ { name: 'token', type: principalT } ],
    output: responseSimpleT(uintT, ),
    mode: 'readonly'
  },
  'get-approved-token-or-fail': {
    input: [ { name: 'token', type: principalT } ],
    output: responseSimpleT(tupleT({
      'accrued-fee': uintT,
      approved: booleanT,
      burnable: booleanT,
      fee: uintT,
      'max-amount': uintT,
      'min-amount': uintT,
      token: principalT
    }, ), ),
    mode: 'readonly'
  },
  'get-contract-owner': {
    input: [],
    output: responseSimpleT(principalT, ),
    mode: 'readonly'
  },
  'get-launch-whitelisted-or-default': {
    input: [
      { name: 'launch-id', type: uintT },
      { name: 'owner', type: bufferT }
    ],
    output: booleanT,
    mode: 'readonly'
  },
  'get-min-fee-or-default': {
    input: [
      { name: 'the-token-id', type: uintT },
      { name: 'the-chain-id', type: uintT }
    ],
    output: uintT,
    mode: 'readonly'
  },
  'get-paused': { input: [], output: booleanT, mode: 'readonly' },
  'get-required-validators': { input: [], output: uintT, mode: 'readonly' },
  'get-token-reserve-or-default': {
    input: [
      { name: 'the-token-id', type: uintT },
      { name: 'the-chain-id', type: uintT }
    ],
    output: uintT,
    mode: 'readonly'
  },
  'get-use-launch-whitelist-or-default': {
    input: [ { name: 'launch-id', type: uintT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'get-use-whitelist': { input: [], output: booleanT, mode: 'readonly' },
  'get-user-id': {
    input: [ { name: 'user', type: principalT } ],
    output: optionalT(uintT, ),
    mode: 'readonly'
  },
  'get-user-id-or-fail': {
    input: [ { name: 'user', type: principalT } ],
    output: responseSimpleT(uintT, ),
    mode: 'readonly'
  },
  'get-validator-id': {
    input: [ { name: 'validator', type: principalT } ],
    output: optionalT(uintT, ),
    mode: 'readonly'
  },
  'get-validator-id-or-fail': {
    input: [ { name: 'validator', type: principalT } ],
    output: responseSimpleT(uintT, ),
    mode: 'readonly'
  },
  'hash-launchpad-order': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'amount-in-fixed': uintT,
          'chain-id': uintT,
          from: bufferT,
          'launch-id': uintT,
          salt: bufferT,
          to: uintT,
          token: uintT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'hash-wrap-order': {
    input: [
      {
        name: 'order',
        type: tupleT({
          'amount-in-fixed': uintT,
          'chain-id': uintT,
          salt: bufferT,
          to: uintT,
          token: uintT
        }, )
      }
    ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'is-approved-operator-or-default': {
    input: [ { name: 'operator', type: principalT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'is-approved-relayer-or-default': {
    input: [ { name: 'relayer', type: principalT } ],
    output: booleanT,
    mode: 'readonly'
  },
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
  'user-from-id': {
    input: [ { name: 'id', type: uintT } ],
    output: optionalT(principalT, ),
    mode: 'readonly'
  },
  'user-from-id-or-fail': {
    input: [ { name: 'id', type: uintT } ],
    output: responseSimpleT(principalT, ),
    mode: 'readonly'
  },
  'validate-launchpad': {
    input: [
      { name: 'launch-id', type: uintT },
      { name: 'from', type: bufferT },
      { name: 'to', type: principalT },
      { name: 'amount', type: uintT },
      { name: 'token', type: principalT }
    ],
    output: responseSimpleT(tupleT({
      'apower-to-burn': uintT,
      offering: tupleT({
        'activation-threshold': uintT,
        'apower-per-ticket-in-fixed': listT(tupleT({ 'apower-per-ticket-in-fixed': uintT, 'tier-threshold': uintT }, ), ),
        'claim-end-height': uintT,
        'fee-per-ticket-in-fixed': uintT,
        'launch-owner': principalT,
        'launch-token': principalT,
        'launch-tokens-per-ticket': uintT,
        'max-size-factor': uintT,
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
  'validator-from-id': {
    input: [ { name: 'id', type: uintT } ],
    output: optionalT(tupleT({ validator: principalT, 'validator-pubkey': bufferT }, ), ),
    mode: 'readonly'
  },
  'validator-from-id-or-fail': {
    input: [ { name: 'id', type: uintT } ],
    output: responseSimpleT(tupleT({ validator: principalT, 'validator-pubkey': bufferT }, ), ),
    mode: 'readonly'
  },
  'launch-whitelisted': {
    input: tupleT({ 'launch-id': uintT, owner: bufferT }, ),
    output: optionalT(booleanT, ),
    mode: 'mapEntry'
  },
  'use-launch-whitelist': { input: uintT, output: optionalT(booleanT, ), mode: 'mapEntry' },
  'whitelisted-users': {
    input: principalT,
    output: optionalT(booleanT, ),
    mode: 'mapEntry'
  },
  'contract-owner': { input: noneT, output: principalT, mode: 'variable' },
  'is-paused': { input: noneT, output: booleanT, mode: 'variable' },
  'order-hash-to-iter': { input: noneT, output: bufferT, mode: 'variable' },
  'use-whitelist': { input: noneT, output: booleanT, mode: 'variable' }
}
} as const)


