
import {
defineContract,
principalT,
uintT,
responseSimpleT,
booleanT,
tupleT,
bufferT,
traitT,
stringT,
listT,
optionalT,
noneT
} from "../smartContractHelpers/codegenImport"

export const crossBridgeRegistryV201 = defineContract({
"cross-bridge-registry-v2-01": {
  'add-accrued-fee': {
    input: [
      { name: 'token', type: principalT },
      { name: 'fee-to-add', type: uintT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'add-token-reserve': {
    input: [
      {
        name: 'pair',
        type: tupleT({ 'chain-id': uintT, token: principalT }, )
      },
      { name: 'reserve-to-add', type: uintT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'add-validator': {
    input: [
      { name: 'validator', type: principalT },
      {
        name: 'details',
        type: tupleT({ 'chain-id': uintT, pubkey: bufferT }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'approve-relayer': {
    input: [
      { name: 'relayer', type: principalT },
      { name: 'approved', type: booleanT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'collect-accrued-fee': {
    input: [ { name: 'token-trait', type: traitT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'remove-accrued-fee': {
    input: [
      { name: 'token', type: principalT },
      { name: 'fee-to-remove', type: uintT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'remove-token-reserve': {
    input: [
      {
        name: 'pair',
        type: tupleT({ 'chain-id': uintT, token: principalT }, )
      },
      { name: 'reserve-to-remove', type: uintT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'remove-validator': {
    input: [ { name: 'validator', type: principalT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-accrued-fee': {
    input: [
      { name: 'token', type: principalT },
      { name: 'new-accrued-fee', type: uintT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-approved-chain': {
    input: [
      { name: 'the-chain-id', type: uintT },
      {
        name: 'chain-details',
        type: tupleT({ 'buff-length': uintT, name: stringT }, )
      }
    ],
    output: responseSimpleT(uintT, ),
    mode: 'public'
  },
  'set-approved-pair': {
    input: [
      {
        name: 'pair',
        type: tupleT({ 'chain-id': uintT, token: principalT }, )
      },
      {
        name: 'details',
        type: tupleT({
          approved: booleanT,
          burnable: booleanT,
          fee: uintT,
          'max-amount': uintT,
          'min-amount': uintT,
          'min-fee': uintT
        }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-fee-to-address': {
    input: [ { name: 'new-address', type: principalT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-order-sent': {
    input: [
      { name: 'order-hash', type: bufferT },
      { name: 'sent', type: booleanT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-order-sent-many': {
    input: [
      { name: 'order-hashes', type: listT(bufferT, ) },
      { name: 'sents', type: listT(booleanT, ) }
    ],
    output: responseSimpleT(listT(responseSimpleT(booleanT, ), ), ),
    mode: 'public'
  },
  'set-order-validated-by': {
    input: [
      {
        name: 'order-tuple',
        type: tupleT({ 'order-hash': bufferT, validator: principalT }, )
      },
      { name: 'validated', type: booleanT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-required-validators': {
    input: [ { name: 'new-required-validators', type: uintT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-token-reserve': {
    input: [
      {
        name: 'pair',
        type: tupleT({ 'chain-id': uintT, token: principalT }, )
      },
      { name: 'new-reserve', type: uintT }
    ],
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
  'transfer-fixed': {
    input: [
      { name: 'token-trait', type: traitT },
      { name: 'amount', type: uintT },
      { name: 'recipient', type: principalT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'get-accrued-fee-or-default': {
    input: [ { name: 'token', type: principalT } ],
    output: uintT,
    mode: 'readonly'
  },
  'get-approved-chain-or-fail': {
    input: [ { name: 'the-chain-id', type: uintT } ],
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
  'get-fee-to-address': { input: [], output: principalT, mode: 'readonly' },
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
  'get-validator-or-fail': {
    input: [ { name: 'validator', type: principalT } ],
    output: responseSimpleT(tupleT({ 'chain-id': uintT, pubkey: bufferT }, ), ),
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
  'accrued-fee': { input: principalT, output: optionalT(uintT, ), mode: 'mapEntry' },
  'approved-pairs': {
    input: tupleT({ 'chain-id': uintT, token: principalT }, ),
    output: optionalT(tupleT({
      approved: booleanT,
      burnable: booleanT,
      fee: uintT,
      'max-amount': uintT,
      'min-amount': uintT,
      'min-fee': uintT,
      reserve: uintT
    }, ), ),
    mode: 'mapEntry'
  },
  'approved-relayers': {
    input: principalT,
    output: optionalT(booleanT, ),
    mode: 'mapEntry'
  },
  'chain-registry': {
    input: uintT,
    output: optionalT(tupleT({ 'buff-length': uintT, name: stringT }, ), ),
    mode: 'mapEntry'
  },
  'order-sent': { input: bufferT, output: optionalT(booleanT, ), mode: 'mapEntry' },
  'order-validated-by': {
    input: tupleT({ 'order-hash': bufferT, validator: principalT }, ),
    output: optionalT(booleanT, ),
    mode: 'mapEntry'
  },
  'validator-registry': {
    input: principalT,
    output: optionalT(tupleT({ 'chain-id': uintT, pubkey: bufferT }, ), ),
    mode: 'mapEntry'
  },
  'chain-nonce': { input: noneT, output: uintT, mode: 'variable' },
  'fee-to-address': { input: noneT, output: principalT, mode: 'variable' },
  'order-hash-to-iter': { input: noneT, output: bufferT, mode: 'variable' },
  'required-validators': { input: noneT, output: uintT, mode: 'variable' }
}
} as const)


