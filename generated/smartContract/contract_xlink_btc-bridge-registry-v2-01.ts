
import {
defineContract,
bufferT,
booleanT,
responseSimpleT,
uintT,
tupleT,
principalT,
optionalT,
noneT
} from "../smartContractHelpers/codegenImport"

export const btcBridgeRegistryV201 = defineContract({
"btc-bridge-registry-v2-01": {
  'approve-peg-in-address': {
    input: [
      { name: 'address', type: bufferT },
      { name: 'approved', type: booleanT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-peg-in-sent': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'output', type: uintT },
      { name: 'sent', type: booleanT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-request': {
    input: [
      { name: 'request-id', type: uintT },
      {
        name: 'details',
        type: tupleT({
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
        }, )
      }
    ],
    output: responseSimpleT(uintT, ),
    mode: 'public'
  },
  'set-request-claim-grace-period': {
    input: [ { name: 'grace-period', type: uintT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-request-revoke-grace-period': {
    input: [ { name: 'grace-period', type: uintT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'get-peg-in-sent-or-default': {
    input: [ { name: 'tx', type: bufferT }, { name: 'output', type: uintT } ],
    output: booleanT,
    mode: 'readonly'
  },
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
  'is-dao-or-extension': { input: [], output: responseSimpleT(booleanT, ), mode: 'readonly' },
  'is-peg-in-address-approved': {
    input: [ { name: 'address', type: bufferT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'approved-peg-in-address': { input: bufferT, output: optionalT(booleanT, ), mode: 'mapEntry' },
  'peg-in-sent': {
    input: tupleT({ output: uintT, tx: bufferT }, ),
    output: optionalT(booleanT, ),
    mode: 'mapEntry'
  },
  requests: {
    input: uintT,
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
      revoked: booleanT
    }, ), ),
    mode: 'mapEntry'
  },
  'request-claim-grace-period': { input: noneT, output: uintT, mode: 'variable' },
  'request-nonce': { input: noneT, output: uintT, mode: 'variable' },
  'request-revoke-grace-period': { input: noneT, output: uintT, mode: 'variable' }
}
} as const)


