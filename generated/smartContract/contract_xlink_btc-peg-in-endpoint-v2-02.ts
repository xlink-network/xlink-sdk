
import {
defineContract,
principalT,
bufferT,
responseSimpleT,
booleanT,
tupleT,
uintT,
listT,
noneT
} from "../smartContractHelpers/codegenImport"

export const btcPegInEndpointV202 = defineContract({
"btc-peg-in-endpoint-v2-02": {
  callback: {
    input: [
      { name: 'sender', type: principalT },
      { name: 'payload', type: bufferT }
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
  'finalize-peg-in-cross': {
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
  'pause-peg-in': {
    input: [ { name: 'paused', type: booleanT } ],
    output: responseSimpleT(booleanT, ),
    mode: 'public'
  },
  'set-fee-to-address': {
    input: [ { name: 'new-fee-to-address', type: principalT } ],
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
  'create-order-0-or-fail': {
    input: [ { name: 'order', type: principalT } ],
    output: responseSimpleT(bufferT, ),
    mode: 'readonly'
  },
  'create-order-cross-or-fail': {
    input: [
      {
        name: 'order',
        type: tupleT({ 'chain-id': uintT, from: bufferT, to: bufferT }, )
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
  'decode-order-cross-or-fail': {
    input: [ { name: 'order-script', type: bufferT } ],
    output: responseSimpleT(tupleT({ 'chain-id': uintT, from: bufferT, to: bufferT }, ), ),
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
  'get-fee-to-address': { input: [], output: principalT, mode: 'readonly' },
  'get-peg-in-fee': { input: [], output: uintT, mode: 'readonly' },
  'get-peg-in-min-fee': { input: [], output: uintT, mode: 'readonly' },
  'get-peg-in-sent-or-default': {
    input: [ { name: 'tx', type: bufferT }, { name: 'output', type: uintT } ],
    output: booleanT,
    mode: 'readonly'
  },
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
  'is-peg-in-paused': { input: [], output: booleanT, mode: 'readonly' },
  'validate-tx-0': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'output-idx', type: uintT },
      { name: 'order-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({ 'amount-net': uintT, fee: uintT, 'order-details': principalT }, ), ),
    mode: 'readonly'
  },
  'validate-tx-cross': {
    input: [
      { name: 'tx', type: bufferT },
      { name: 'output-idx', type: uintT },
      { name: 'order-idx', type: uintT }
    ],
    output: responseSimpleT(tupleT({
      'amount-net': uintT,
      fee: uintT,
      'order-details': tupleT({ 'chain-id': uintT, from: bufferT, to: bufferT }, )
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
  'fee-to-address': { input: noneT, output: principalT, mode: 'variable' },
  'peg-in-fee': { input: noneT, output: uintT, mode: 'variable' },
  'peg-in-min-fee': { input: noneT, output: uintT, mode: 'variable' },
  'peg-in-paused': { input: noneT, output: booleanT, mode: 'variable' }
}
} as const)


