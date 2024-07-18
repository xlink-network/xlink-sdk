
import {
defineContract,
principalT,
bufferT,
responseSimpleT,
booleanT,
uintT,
tupleT,
listT,
noneT
} from "../smartContractHelpers/codegenImport"

export const btcPegOutEndpointV201 = defineContract({
"btc-peg-out-endpoint-v2-01": {
  callback: {
    input: [
      { name: 'sender', type: principalT },
      { name: 'payload', type: bufferT }
    ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
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
  'revoke-peg-out': {
    input: [ { name: 'request-id', type: uintT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-fee-to-address': {
    input: [ { name: 'new-fee-to-address', type: principalT } ],
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
  'get-fee-to-address': { input: [], output: principalT, mode: 'readonly' },
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
  'is-dao-or-extension': { input: [], output: responseSimpleT(booleanT, ), mode: 'readonly' },
  'is-peg-in-address-approved': {
    input: [ { name: 'address', type: bufferT } ],
    output: booleanT,
    mode: 'readonly'
  },
  'is-peg-out-paused': { input: [], output: booleanT, mode: 'readonly' },
  'validate-peg-out-0': {
    input: [ { name: 'amount', type: uintT } ],
    output: responseSimpleT(tupleT({ amount: uintT, fee: uintT, 'gas-fee': uintT }, ), ),
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
  'peg-out-fee': { input: noneT, output: uintT, mode: 'variable' },
  'peg-out-min-fee': { input: noneT, output: uintT, mode: 'variable' },
  'peg-out-paused': { input: noneT, output: booleanT, mode: 'variable' }
}
} as const)


