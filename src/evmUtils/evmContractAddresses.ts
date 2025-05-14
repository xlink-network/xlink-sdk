
/**
 * source: https://github.com/alexgo-io/alex-app/blob/3d842513272ba7478dcd6512bae9fa8d883d2cc5/functions/_handlers/services/getEVMOnChainConfig.evmAddressHelpers.ts#L5-L17
 */
export type EVMEndpointContract =
  | typeof EVMEndpointContract.BridgeEndpoint
  | typeof EVMEndpointContract.NativeBridgeEndpoint
  | typeof EVMEndpointContract.BridgeConfig
  | typeof EVMEndpointContract.TimeLock
  | typeof EVMEndpointContract.Registry
export namespace EVMEndpointContract {
  export const BridgeEndpoint = "BridgeEndpoint"
  export const NativeBridgeEndpoint = "NativeBridgeEndpoint"
  export const BridgeConfig = "BridgeConfig"
  export const TimeLock = "TimeLock"
  export const Registry = "Registry"
}
