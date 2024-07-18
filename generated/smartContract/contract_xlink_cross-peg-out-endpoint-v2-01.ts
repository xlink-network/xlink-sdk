
import {
defineContract,
booleanT,
responseSimpleT,
principalT,
bufferT,
traitT,
uintT,
listT,
tupleT,
stringT,
optionalT,
noneT
} from "../smartContractHelpers/codegenImport"

export const crossPegOutEndpointV201 = defineContract({
"cross-peg-out-endpoint-v2-01": {
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
  'set-paused': {
    input: [ { name: 'paused', type: booleanT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'transfer-to-unwrap': {
    input: [
      { name: 'token-trait', type: traitT },
      { name: 'amount-in-fixed', type: uintT },
      { name: 'dest-chain-id', type: uintT },
      { name: 'settle-address', type: bufferT }
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
  'get-approved-chain-or-fail': {
    input: [ { name: 'dest-chain-id', type: uintT } ],
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
  'is-dao-or-extension': { input: [], output: responseSimpleT(booleanT, ), mode: 'readonly' },
  'is-whitelisted': {
    input: [ { name: 'user', type: principalT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'validate-transfer-to-unwrap': {
    input: [
      { name: 'sender', type: principalT },
      { name: 'token', type: principalT },
      { name: 'amount-in-fixed', type: uintT },
      { name: 'dest-chain-id', type: uintT }
    ],
    output: responseSimpleT(tupleT({
      amount: uintT,
      'chain-details': tupleT({ 'buff-length': uintT, name: stringT }, ),
      token: principalT,
      'token-details': tupleT({
        approved: booleanT,
        burnable: booleanT,
        fee: uintT,
        'max-amount': uintT,
        'min-amount': uintT,
        'min-fee': uintT,
        reserve: uintT
      }, )
    }, ), ),
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


