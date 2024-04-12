import { defineContract } from "../smartContractHelpers/codegenImport";
import { btcBridgeEndpointV111 } from "./contract_xlink_btc-bridge-endpoint-v1-11"
import { crossBridgeEndpointV103 } from "./contract_xlink_cross-bridge-endpoint-v1-03"

export const xlinkContracts = defineContract({
...btcBridgeEndpointV111,
...crossBridgeEndpointV103
});

  