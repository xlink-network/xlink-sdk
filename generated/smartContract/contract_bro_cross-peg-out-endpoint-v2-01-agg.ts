
import {
defineContract,
booleanT,
responseSimpleT,
uintT,
traitT,
principalT,
optionalT,
tupleT,
bufferT,
stringT,
noneT
} from "../smartContractHelpers/codegenImport"

export const crossPegOutEndpointV201Agg = defineContract({
"cross-peg-out-endpoint-v2-01-agg": {
  'set-paused': {
    input: [ { name: 'paused', type: booleanT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'transfer-to-swap': {
    input: [
      { name: 'amount-in-fixed', type: uintT },
      { name: 'token-in-trait', type: traitT },
      { name: 'token-out', type: principalT },
      { name: 'min-amount-out', type: optionalT(uintT, ) },
      { name: 'dest-chain-id', type: uintT },
      { name: 'expiry', type: uintT },
      {
        name: 'success-settle',
        type: tupleT({ address: bufferT, 'chain-id': optionalT(uintT, ), token: principalT }, )
      },
      {
        name: 'fail-settle',
        type: tupleT({ address: bufferT, 'chain-id': optionalT(uintT, ), token: principalT }, )
      }
    ],
    output: responseSimpleT(booleanT, ),
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
  'is-dao-or-extension': { input: [], output: responseSimpleT(booleanT, ), mode: 'readonly' },
  'validate-transfer-to-swap': {
    input: [
      { name: 'sender', type: principalT },
      { name: 'amount-in-fixed', type: uintT },
      { name: 'token-in', type: principalT },
      { name: 'token-out', type: principalT },
      { name: 'dest-chain-id', type: uintT },
      {
        name: 'success-settle',
        type: tupleT({ address: bufferT, 'chain-id': optionalT(uintT, ), token: principalT }, )
      },
      {
        name: 'fail-settle',
        type: tupleT({ address: bufferT, 'chain-id': optionalT(uintT, ), token: principalT }, )
      }
    ],
    output: responseSimpleT(tupleT({
      amount: uintT,
      'chain-details': tupleT({ 'buff-length': uintT, name: stringT }, ),
      'fail-settle': tupleT({ address: bufferT, 'chain-id': optionalT(uintT, ), token: principalT }, ),
      'success-settle': tupleT({ address: bufferT, 'chain-id': optionalT(uintT, ), token: principalT }, ),
      'token-in': principalT,
      'token-in-details': tupleT({
        approved: booleanT,
        burnable: booleanT,
        fee: uintT,
        'max-amount': uintT,
        'min-amount': uintT,
        'min-fee': uintT,
        reserve: uintT
      }, ),
      'token-out': principalT,
      'token-out-details': tupleT({
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
  'is-paused': { input: noneT, output: booleanT, mode: 'variable' }
}
} as const)


